export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'controller' | 'user';
  initials: string;
  status: 'active' | 'inactive';
  isOnline: boolean;
  lastSeen: Date;
  isDAF?: boolean; // Utilisateur DAF spécial
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  vehicleId: string;
  vehicleName: string;
  destination: string;
  purpose: string;
  needDriver: boolean;
  startDate: Date;
  endDate: Date;
  status: "pending" | "validated" | "cancelled" | "completed";
  createdAt: Date;
  cancelReason?: string;
  cancelledBy?: string;
  validatedBy?: string;
  completedBy?: string;
}
