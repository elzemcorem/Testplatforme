# 🚀 Migration vers Supabase Realtime - Chat & Réservations

## 📋 Vue d'ensemble

Actuellement :
- ❌ Chat stocké en localStorage (pas de realtime)
- ❌ Réservations en localStorage (pas de synchronisation)

Après :
- ✅ Chat sur Supabase avec subscriptions realtime
- ✅ Réservations sur Supabase avec notifications realtime
- ✅ Tous les utilisateurs voient les mises à jour instantanément

---

## 📊 Étape 1 : Créer les tables Supabase

Va dans **Supabase Dashboard → SQL Editor** et exécute :

### Table: `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id VARCHAR NOT NULL,
  sender_name VARCHAR NOT NULL,
  sender_initials VARCHAR(2),
  receiver_id VARCHAR,  -- NULL = message général
  content TEXT NOT NULL,
  conversation_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_chat_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
```

### Table: `reservations`
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id VARCHAR NOT NULL,
  vehicle_name VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  user_name VARCHAR NOT NULL,
  user_email VARCHAR NOT NULL,
  destination VARCHAR NOT NULL,
  purpose TEXT NOT NULL,
  need_driver BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR DEFAULT 'pending',
  cancel_reason TEXT,
  cancelled_by VARCHAR,
  validated_by VARCHAR,
  completed_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);
```

### Table: `reservation_notifications` (optionnel mais recommandé)
```sql
CREATE TABLE reservation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  user_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL,  -- 'created', 'validated', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 Étape 2 : Créer les services Supabase

### Fichier: `src/services/chatService.ts`

```typescript
import { supabase } from '../utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_initials: string;
  receiver_id: string | null;
  content: string;
  conversation_id: string;
  created_at: string;
}

class ChatService {
  private channel: RealtimeChannel | null = null;

  // 📥 Charger l'historique des messages
  async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return data || [];
  }

  // 📤 Envoyer un message
  async sendMessage(
    senderId: string,
    senderName: string,
    senderInitials: string,
    content: string,
    conversationId: string,
    receiverId?: string
  ): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: senderId,
        sender_name: senderName,
        sender_initials: senderInitials,
        receiver_id: receiverId || null,
        content,
        conversation_id: conversationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  }

  // 🔄 Subscribe aux mises à jour realtime
  subscribeToConversation(
    conversationId: string,
    onMessageReceived: (message: ChatMessage) => void,
    onMessageDeleted?: (messageId: string) => void
  ): () => void {
    this.channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          onMessageReceived(payload.new as ChatMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (onMessageDeleted) {
            onMessageDeleted(payload.old.id);
          }
        }
      )
      .subscribe();

    // Retourner une fonction pour se désabonner
    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
      }
    };
  }

  // 🗑️ Supprimer un message
  async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  }
}

export const chatService = new ChatService();
```

### Fichier: `src/services/reservationService.ts`

```typescript
import { supabase } from '../utils/supabase/client';
import { Reservation } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

class ReservationService {
  private channel: RealtimeChannel | null = null;

  // 📥 Charger toutes les réservations
  async loadReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reservations:', error);
      return [];
    }

    return data?.map(r => this.mapFromDB(r)) || [];
  }

  // 📥 Charger les réservations d'un utilisateur
  async loadUserReservations(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading user reservations:', error);
      return [];
    }

    return data?.map(r => this.mapFromDB(r)) || [];
  }

  // 📤 Créer une réservation
  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        vehicle_id: reservation.vehicleId,
        vehicle_name: reservation.vehicleName,
        user_id: reservation.userId,
        user_name: reservation.userName,
        user_email: reservation.userEmail,
        destination: reservation.destination,
        purpose: reservation.purpose,
        need_driver: reservation.needDriver,
        start_date: reservation.startDate.toISOString(),
        end_date: reservation.endDate.toISOString(),
        status: reservation.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      return null;
    }

    return this.mapFromDB(data);
  }

  // ✏️ Mettre à jour une réservation
  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    const dbUpdates: any = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.cancelReason) dbUpdates.cancel_reason = updates.cancelReason;
    if (updates.cancelledBy) dbUpdates.cancelled_by = updates.cancelledBy;
    if (updates.validatedBy) dbUpdates.validated_by = updates.validatedBy;
    if (updates.completedBy) dbUpdates.completed_by = updates.completedBy;

    const { data, error } = await supabase
      .from('reservations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      return null;
    }

    return this.mapFromDB(data);
  }

  // 🔄 Subscribe aux mises à jour realtime
  subscribeToReservations(
    onReservationCreated?: (reservation: Reservation) => void,
    onReservationUpdated?: (reservation: Reservation) => void,
    onReservationDeleted?: (reservationId: string) => void
  ): () => void {
    this.channel = supabase
      .channel('reservations:all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
        },
        (payload) => {
          console.log('🆕 New reservation:', payload.new);
          if (onReservationCreated) {
            onReservationCreated(this.mapFromDB(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
        },
        (payload) => {
          console.log('✏️ Reservation updated:', payload.new);
          if (onReservationUpdated) {
            onReservationUpdated(this.mapFromDB(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reservations',
        },
        (payload) => {
          console.log('🗑️ Reservation deleted:', payload.old.id);
          if (onReservationDeleted) {
            onReservationDeleted(payload.old.id);
          }
        }
      )
      .subscribe();

    // Retourner fonction pour se désabonner
    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
      }
    };
  }

  // 🔄 Subscribe aux réservations d'un utilisateur spécifique
  subscribeToUserReservations(
    userId: string,
    onReservationChanged: (reservation: Reservation) => void
  ): () => void {
    this.channel = supabase
      .channel(`reservations:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📢 Your reservation changed:', payload);
          if (payload.eventType !== 'DELETE') {
            onReservationChanged(this.mapFromDB(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
      }
    };
  }

  // 🗺️ Convertir depuis DB vers objet Reservation
  private mapFromDB(dbReservation: any): Reservation {
    return {
      id: dbReservation.id,
      vehicleId: dbReservation.vehicle_id,
      vehicleName: dbReservation.vehicle_name,
      userId: dbReservation.user_id,
      userName: dbReservation.user_name,
      userEmail: dbReservation.user_email,
      destination: dbReservation.destination,
      purpose: dbReservation.purpose,
      needDriver: dbReservation.need_driver,
      startDate: new Date(dbReservation.start_date),
      endDate: new Date(dbReservation.end_date),
      status: dbReservation.status,
      cancelReason: dbReservation.cancel_reason,
      cancelledBy: dbReservation.cancelled_by,
      validatedBy: dbReservation.validated_by,
      completedBy: dbReservation.completed_by,
      createdAt: new Date(dbReservation.created_at),
    };
  }
}

export const reservationService = new ReservationService();
```

---

## 💻 Étape 3 : Modifier le composant Chat

### Avant (localStorage)
```typescript
const stored = localStorage.getItem("chat_messages");
localStorage.setItem("chat_messages", JSON.stringify(newMessages));
```

### Après (Supabase Realtime)

```typescript
import { chatService } from '../services/chatService';

export function Chat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Charger les messages et s'abonner aux mises à jour
  useEffect(() => {
    if (!currentUser) return;

    const loadAndSubscribe = async () => {
      // Charger l'historique
      const loadedMessages = await chatService.loadMessages('general');
      setMessages(loadedMessages);

      // S'abonner aux nouveaux messages
      const unsubscribe = chatService.subscribeToConversation(
        'general',
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        }
      );

      return unsubscribe;
    };

    const unsubscribe = loadAndSubscribe();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, [currentUser]);

  // Envoyer un message
  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;

    const success = await chatService.sendMessage(
      currentUser.id,
      currentUser.name,
      currentUser.initials,
      text,
      'general'
    );

    if (!success) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  return (
    // ... JSX
  );
}
```

---

## 📦 Étape 4 : Modifier le composant Réservations

### Avant (localStorage)
```typescript
const stored = localStorage.getItem("reservations");
localStorage.setItem("reservations", JSON.stringify(reservations));
```

### Après (Supabase Realtime)

```typescript
import { reservationService } from '../services/reservationService';

export function ReservationsPage() {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Charger et s'abonner aux réservations
  useEffect(() => {
    if (!currentUser) return;

    const loadAndSubscribe = async () => {
      // Charger l'historique
      const loaded = await reservationService.loadUserReservations(currentUser.id);
      setReservations(loaded);

      // S'abonner aux mises à jour realtime
      const unsubscribe = reservationService.subscribeToUserReservations(
        currentUser.id,
        (updatedReservation) => {
          setReservations(prev => {
            const index = prev.findIndex(r => r.id === updatedReservation.id);
            if (index >= 0) {
              // Mettre à jour
              const updated = [...prev];
              updated[index] = updatedReservation;
              return updated;
            } else {
              // Ajouter
              return [...prev, updatedReservation];
            }
          });
        }
      );

      return unsubscribe;
    };

    const cleanup = loadAndSubscribe();
    return () => {
      cleanup?.then(unsub => unsub?.());
    };
  }, [currentUser]);

  // Créer une réservation
  const handleCreateReservation = async (formData: any) => {
    if (!currentUser) return;

    const success = await reservationService.createReservation({
      ...formData,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      status: 'pending',
    });

    if (success) {
      toast.success('Réservation créée avec succès');
    } else {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    // ... JSX
  );
}
```

---

## 🔄 Étape 5 : Configuration des Row Level Security (RLS)

Pour la sécurité, va dans **Supabase → Auth → Policies** et crée :

### Policy: `chat_messages` - Les utilisateurs peuvent voir tous les messages généraux
```sql
CREATE POLICY "Allow viewing general messages"
ON chat_messages
FOR SELECT
USING (receiver_id IS NULL OR sender_id = auth.uid() OR receiver_id = auth.uid());
```

### Policy: `chat_messages` - Les utilisateurs peuvent envoyer des messages
```sql
CREATE POLICY "Allow sending messages"
ON chat_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid()::text);
```

### Policy: `reservations` - Les utilisateurs voient leurs réservations
```sql
CREATE POLICY "Users can view their reservations"
ON reservations
FOR SELECT
USING (user_id = auth.uid()::text);
```

### Policy: `reservations` - Les utilisateurs peuvent créer des réservations
```sql
CREATE POLICY "Users can create reservations"
ON reservations
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);
```

---

## 📱 Étape 6 : Avantages du Realtime

### Avant (localStorage)
```
Utilisateur A écrit un message
         ↓ (localement)
Utilisateur B ne le voit pas
```

### Après (Supabase Realtime)
```
Utilisateur A écrit un message
         ↓ (Supabase)
         ↓ (Realtime subscription)
Utilisateur B voit INSTANTANÉMENT
```

---

## 🚀 Étapes de déploiement

1. ✅ Créer les tables dans Supabase
2. ✅ Créer les services (`chatService.ts`, `reservationService.ts`)
3. ✅ Modifier les composants (Chat, ReservationsPage, etc.)
4. ✅ Configurer RLS
5. ✅ Tester en local avec `npm run dev`
6. ✅ Tester avec plusieurs utilisateurs
7. ✅ Pousser sur GitHub
8. ✅ Déployer en production

---

## 🧪 Test rapidement

### Test 1: Chat Realtime
1. Ouvrir deux onglets (2 utilisateurs différents)
2. Envoyer un message depuis l'onglet 1
3. Vérifier qu'il apparaît IMMÉDIATEMENT dans l'onglet 2 ✅

### Test 2: Réservations Realtime
1. Créer une réservation depuis un utilisateur
2. Voir les mises à jour en temps réel dans tous les onglets ✅

---

## ⚡ Performance

### Optimisations:
- Index sur les colonnes clés
- Limit sur les requêtes (100 messages max)
- Subscriptions au niveau conversation (pas tout charger)
- Pagination optionnelle pour les anciens messages

---

**Complexité** : ⭐⭐⭐⭐ (moyenne-haute)
**Temps estimé** : 4-6 heures
**Bénéfice** : 🚀 Realtime complet, multi-utilisateur

