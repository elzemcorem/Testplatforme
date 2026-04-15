// Types pour l'application Bénin Petro

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

export interface Reservation {
  id: string;
  vehicleId: string;
  vehicleName: string;
  userName: string;
  userEmail: string;
  userId: string;
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  timestamp: Date;
}