import { createClient } from '@supabase/supabase-js';

// ─── Env vars (Vite) ────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ════════════════════════════════════════════════════════════
// TYPES — alignés sur src/types.ts + schema DB
// ════════════════════════════════════════════════════════════

export type UserRole   = 'admin' | 'controller' | 'user';
export type VehicleType = 'Berline' | 'SUV' | 'Pickup' | 'Minibus' | 'Camion' | 'Moto';
export type FuelType    = 'Essence' | 'Diesel' | 'Électrique' | 'Hybride';
export type ReservationStatus = 'pending' | 'validated' | 'cancelled' | 'completed';
export type NotifType =
  | 'reservation_validated'
  | 'reservation_cancelled'
  | 'reservation_completed'
  | 'new_reservation'
  | 'system';

export interface Profile {
  id:          string;
  name:        string;
  email:       string;
  role:        UserRole;
  status:      'active' | 'inactive';
  avatar_url?: string;
  phone?:      string;
  department?: string;
  is_online:   boolean;
  last_seen?:  string;
  created_at:  string;
  updated_at:  string;
}

export interface Vehicle {
  id:           string;
  name:         string;
  type:         VehicleType;
  plate?:       string;
  brand?:       string;
  model?:       string;
  year?:        number;
  capacity:     number;
  fuel_type:    FuelType;
  mileage:      number;
  is_available: boolean;
  status:       'good' | 'maintenance' | 'out_of_service';
  image_url?:   string;
  notes?:       string;
  created_at:   string;
  updated_at:   string;
}

export interface Reservation {
  id:            string;
  user_id:       string;
  vehicle_id:    string;
  destination:   string;
  purpose:       string;
  need_driver:   boolean;
  start_date:    string;
  end_date:      string;
  status:        ReservationStatus;
  cancel_reason?: string;
  cancelled_by?:  string;
  validated_by?:  string;
  completed_by?:  string;
  created_at:    string;
  updated_at:    string;
}

export interface ReservationFull extends Reservation {
  user_name:     string;
  user_email:    string;
  user_avatar?:  string;
  vehicle_name:  string;
  vehicle_type:  VehicleType;
  vehicle_plate?: string;
  vehicle_image?: string;
}

export interface Notification {
  id:              string;
  user_id:         string;
  type:            NotifType;
  title:           string;
  message:         string;
  is_read:         boolean;
  reservation_id?: string;
  created_at:      string;
}

export interface ChatMessage {
  id:         string;
  sender_id:  string;
  content:    string;
  is_deleted: boolean;
  created_at: string;
}

// ════════════════════════════════════════════════════════════
// API — AUTH
// ════════════════════════════════════════════════════════════

export const authApi = {
  /** Connexion email + mot de passe */
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** Inscription (le trigger crée le profil automatiquement) */
  signUp: (email: string, password: string, name: string, role: UserRole = 'user') =>
    supabase.auth.signUp({ email, password, options: { data: { name, role } } }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(callback),
};

// ════════════════════════════════════════════════════════════
// API — PROFILES
// ════════════════════════════════════════════════════════════

export const profilesApi = {
  /** Profil d'un utilisateur */
  getById: (id: string) =>
    supabase.from('profiles').select('*').eq('id', id).single<Profile>(),

  /** Tous les profils (admin seulement via RLS) */
  getAll: () =>
    supabase.from('profiles').select('*').order('name').returns<Profile[]>(),

  /** Mettre à jour son propre profil */
  update: (id: string, data: Partial<Pick<Profile, 'name' | 'phone' | 'department' | 'avatar_url' | 'is_online' | 'last_seen'>>) =>
    supabase.from('profiles').update(data).eq('id', id).select().single<Profile>(),

  /** Changer le rôle d'un utilisateur (admin) */
  setRole: (id: string, role: UserRole) =>
    supabase.from('profiles').update({ role }).eq('id', id).select().single<Profile>(),

  /** Mettre à jour le statut en ligne */
  setOnline: (id: string, is_online: boolean) =>
    supabase.from('profiles').update({ is_online, last_seen: new Date().toISOString() }).eq('id', id),
};

// ════════════════════════════════════════════════════════════
// API — VEHICLES
// ════════════════════════════════════════════════════════════

export const vehiclesApi = {
  getAll: () =>
    supabase.from('vehicles').select('*').order('name').returns<Vehicle[]>(),

  getAvailable: (from: string, to: string) =>
    supabase.rpc('get_available_vehicles', { p_start: from, p_end: to }).returns<Vehicle[]>(),

  getById: (id: string) =>
    supabase.from('vehicles').select('*').eq('id', id).single<Vehicle>(),

  create: (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) =>
    supabase.from('vehicles').insert(data).select().single<Vehicle>(),

  update: (id: string, data: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>) =>
    supabase.from('vehicles').update(data).eq('id', id).select().single<Vehicle>(),

  delete: (id: string) =>
    supabase.from('vehicles').delete().eq('id', id),

  setAvailability: (id: string, is_available: boolean) =>
    supabase.from('vehicles').update({ is_available }).eq('id', id),
};

// ════════════════════════════════════════════════════════════
// API — RESERVATIONS
// ════════════════════════════════════════════════════════════

export const reservationsApi = {
  /** Vue complète avec infos user + vehicle */
  getAll: () =>
    supabase.from('reservations_full').select('*').order('created_at', { ascending: false }).returns<ReservationFull[]>(),

  /** Réservations de l'utilisateur connecté */
  getMine: (userId: string) =>
    supabase.from('reservations_full').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<ReservationFull[]>(),

  getById: (id: string) =>
    supabase.from('reservations_full').select('*').eq('id', id).single<ReservationFull>(),

  getByStatus: (status: ReservationStatus) =>
    supabase.from('reservations_full').select('*').eq('status', status).order('start_date').returns<ReservationFull[]>(),

  create: (data: Pick<Reservation, 'user_id' | 'vehicle_id' | 'destination' | 'purpose' | 'need_driver' | 'start_date' | 'end_date'>) =>
    supabase.from('reservations').insert(data).select().single<Reservation>(),

  /** Valider une réservation */
  validate: (id: string, validatedBy: string) =>
    supabase.from('reservations').update({ status: 'validated', validated_by: validatedBy }).eq('id', id).select().single<Reservation>(),

  /** Annuler */
  cancel: (id: string, cancelledBy: string, cancel_reason: string) =>
    supabase.from('reservations').update({ status: 'cancelled', cancelled_by: cancelledBy, cancel_reason }).eq('id', id).select().single<Reservation>(),

  /** Marquer comme terminée */
  complete: (id: string, completedBy: string) =>
    supabase.from('reservations').update({ status: 'completed', completed_by: completedBy }).eq('id', id).select().single<Reservation>(),
};

// ════════════════════════════════════════════════════════════
// API — NOTIFICATIONS
// ════════════════════════════════════════════════════════════

export const notificationsApi = {
  getMine: (userId: string) =>
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Notification[]>(),

  getUnread: (userId: string) =>
    supabase.from('notifications').select('*').eq('user_id', userId).eq('is_read', false).returns<Notification[]>(),

  markRead: (id: string) =>
    supabase.from('notifications').update({ is_read: true }).eq('id', id),

  markAllRead: (userId: string) =>
    supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false),

  create: (data: Omit<Notification, 'id' | 'created_at' | 'is_read'>) =>
    supabase.from('notifications').insert({ ...data, is_read: false }).select().single<Notification>(),
};

// ════════════════════════════════════════════════════════════
// API — CHAT
// ════════════════════════════════════════════════════════════

export const chatApi = {
  getMessages: (limit = 50) =>
    supabase.from('chat_messages').select(`
      *,
      sender:profiles(id, name, avatar_url, role)
    `).eq('is_deleted', false).order('created_at', { ascending: false }).limit(limit),

  send: (senderId: string, content: string) =>
    supabase.from('chat_messages').insert({ sender_id: senderId, content }).select().single<ChatMessage>(),

  delete: (id: string) =>
    supabase.from('chat_messages').update({ is_deleted: true }).eq('id', id),

  /** Realtime — écouter les nouveaux messages */
  subscribe: (callback: (msg: ChatMessage) => void) =>
    supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) =>
        callback(payload.new as ChatMessage)
      )
      .subscribe(),
};

// ════════════════════════════════════════════════════════════
// API — REALTIME HELPERS
// ════════════════════════════════════════════════════════════

export const realtimeApi = {
  /** Écouter les nouvelles réservations (admin/controller) */
  onNewReservation: (callback: (r: Reservation) => void) =>
    supabase
      .channel('reservations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (p) =>
        callback(p.new as Reservation)
      )
      .subscribe(),

  /** Écouter les changements de statut */
  onReservationUpdate: (callback: (r: Reservation) => void) =>
    supabase
      .channel('reservation-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (p) =>
        callback(p.new as Reservation)
      )
      .subscribe(),

  /** Écouter ses propres notifications */
  onNotification: (userId: string, callback: (n: Notification) => void) =>
    supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (p) => callback(p.new as Notification))
      .subscribe(),
};
