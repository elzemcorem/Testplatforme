# 👨‍💻 Developer Guide - Intégration de l'authentification

## 🔗 Importer les utilitaires d'authentification

```typescript
// Dans vos composants
import { useAuth } from '../contexts/AuthContext';
import { checkAllowedUser, determineUserRole } from '../utils/auth';
```

## 💻 Utiliser le contexte d'authentification

### Récupérer l'utilisateur courant

```typescript
import { useAuth } from '../contexts/AuthContext';

export function MonComposant() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return <p>Chargement...</p>;
  
  if (!currentUser) return <p>Pas connecté</p>;

  return (
    <div>
      <h1>Bienvenue {currentUser.name}</h1>
      <p>Rôle: {currentUser.role}</p>
    </div>
  );
}
```

### Accès en fonction du rôle

```typescript
export function AdminPanel() {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'admin') {
    return <p>⛔ Accès administrateur requis</p>;
  }

  return <div>Contenu admin</div>;
}
```

### Vérifier plusieurs rôles

```typescript
export function ControlPanel() {
  const { currentUser } = useAuth();
  
  const canAccess = ['admin', 'controller'].includes(currentUser?.role || '');
  
  if (!canAccess) {
    return <p>⛔ Accès contrôleur/admin requis</p>;
  }

  return <div>Contenu contrôle</div>;
}
```

## 🔐 Protéger les routes (exemple)

```typescript
// RouteGuard.tsx
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'controller' | 'user';
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return <p>Chargement...</p>;

  if (!currentUser) {
    return fallback || <p>Veuillez vous connecter</p>;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return fallback || <p>Accès refusé</p>;
  }

  return <>{children}</>;
}

// Utilisation
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

## 🔍 Vérifier un utilisateur avant une action

```typescript
export async function handleAdminAction(email: string) {
  // Vérifier que l'utilisateur est autorisé
  const allowedUser = await checkAllowedUser(email);
  
  if (!allowedUser?.allowed) {
    console.error('Utilisateur non autorisé');
    return;
  }

  console.log(`Utilisateur ${email} a le rôle ${allowedUser.role}`);
  
  // Continuer l'action
}
```

## 🎯 Obtenir le rôle dynamiquement

```typescript
export async function getUserInfo(email: string) {
  // Récupérer les infos de l'utilisateur
  const info = await checkAllowedUser(email);
  
  if (!info?.allowed) {
    return null;
  }

  // Récupérer le rôle
  const role = await determineUserRole(email);
  
  return {
    name: info.name,
    role: role,
    id: info.id,
  };
}
```

## 📊 Afficher le rôle avec un badge

```typescript
import { Badge } from '@/components/ui/badge';

interface RoleBadgeProps {
  role: 'admin' | 'controller' | 'user';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-500' },
    controller: { label: 'Contrôleur', color: 'bg-blue-500' },
    user: { label: 'Utilisateur', color: 'bg-green-500' },
  };

  const config = roleConfig[role];
  
  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
}

// Utilisation
<RoleBadge role={currentUser.role} />
```

## 🔄 Recharger les infos utilisateur après une modification

```typescript
export async function updateUserRole(email: string, newRole: string) {
  // Mettre à jour en base de données
  await fetch('/api/updateRole', {
    method: 'POST',
    body: JSON.stringify({ email, role: newRole }),
  });

  // Le rôle sera mis à jour à la prochaine connexion
  // Pour forcer la mise à jour immédiate:
  const updatedRole = await determineUserRole(email);
  console.log(`Nouveau rôle: ${updatedRole}`);
}
```

## 📝 Exemples de composants

### Componant: UserProfile

```typescript
export function UserProfile() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="user-profile">
      <h2>{currentUser.name}</h2>
      <p>{currentUser.email}</p>
      <p>Rôle: {currentUser.role}</p>
      <p>Status: {currentUser.status}</p>
      <p>En ligne: {currentUser.isOnline ? 'Oui' : 'Non'}</p>
    </div>
  );
}
```

### Component: AdminOnlyButton

```typescript
interface AdminOnlyButtonProps {
  onClick: () => void;
  children: string;
}

export function AdminOnlyButton({ onClick, children }: AdminOnlyButtonProps) {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'admin') {
    return (
      <button disabled title="Réservé aux administrateurs">
        {children}
      </button>
    );
  }

  return <button onClick={onClick}>{children}</button>;
}
```

### Component: RoleBasedMenu

```typescript
import { useAuth } from '../contexts/AuthContext';

export function RoleBasedMenu() {
  const { currentUser } = useAuth();

  const menuItems = {
    admin: ['Dashboard', 'Users', 'Settings', 'Reports'],
    controller: ['Dashboard', 'Validations', 'Reports'],
    user: ['Dashboard', 'Reservations'],
  };

  const items = menuItems[currentUser?.role || 'user'];

  return (
    <nav>
      {items.map(item => (
        <a key={item} href={`/${item.toLowerCase()}`}>
          {item}
        </a>
      ))}
    </nav>
  );
}
```

## 🧪 Tests

### Test de login

```typescript
// test/auth.test.ts
import { checkAllowedUser } from '../utils/auth';

describe('Authentication', () => {
  test('devrait trouver un utilisateur autorisé', async () => {
    const result = await checkAllowedUser('admin@test.com');
    expect(result.allowed).toBe(true);
    expect(result.role).toBe('admin');
  });

  test('devrait rejeter un email non autorisé', async () => {
    const result = await checkAllowedUser('unknown@test.com');
    expect(result.allowed).toBe(false);
  });
});
```

## 🔗 API Patterns

### Récupérer les infos du rôle côté backend

```typescript
// Exemple si vous aviez une API backend
export async function fetchUserWithRole(email: string) {
  const response = await fetch(`/api/users/${email}`);
  const data = await response.json();
  
  return {
    name: data.noms,
    role: data.role,
    email: data.email,
  };
}
```

## ⚠️ Bonne pratiques

### ✅ À FAIRE

```typescript
// Vérifier le rôle AVANT d'afficher du contenu sensible
if (currentUser?.role === 'admin') {
  return <AdminContent />;
}

// Utiliser TypeScript pour le rôle
const role: UserRole = 'admin'; // ✅ Correct

// Verifier l'existence avant d'utiliser
if (currentUser) {
  console.log(currentUser.role);
}
```

### ❌ À NE PAS FAIRE

```typescript
// Ne pas afficher du contenu admin sans vérification
<AdminContent />  // ❌ Dangereux

// Ne pas utiliser les rôles comme strings libres
const role = 'superadmin'; // ❌ Type invalide

// Ne pas supposer l'existence de currentUser
console.log(currentUser.role); // ❌ Peut crasher
```

## 📚 Types TypeScript utiles

```typescript
// Depuis types/index.ts
export type UserRole = "admin" | "controller" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  status: "active" | "restricted" | "banned";
  isOnline?: boolean;
  lastSeen?: Date;
}

// Utiliser ces types dans vos composants
interface MyComponentProps {
  user: User;
  onRoleChange: (newRole: UserRole) => void;
}
```

---

**Version** : 1.0
**Dernière mise à jour** : 16 avril 2026
