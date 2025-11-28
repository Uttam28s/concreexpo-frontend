// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER';
  createdAt: string;
  updatedAt: string;
}

// Client Types
export interface ClientType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  primaryContact: string;
  secondaryContact?: string | null;
  address?: string | null;
  clientTypeId?: string | null;
  clientType?: ClientType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateClientDto {
  name: string;
  primaryContact: string;
  secondaryContact?: string;
  address?: string;
  clientTypeId?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

// Engineer Types
export interface Engineer {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateEngineerDto {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface UpdateEngineerDto {
  name?: string;
  email?: string;
  mobileNumber?: string;
  isActive?: boolean;
}

// Material Types
export interface Material {
  id: string;
  name: string;
  unit: string;
  reorderLevel?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateMaterialDto {
  name: string;
  reorderLevel?: number;
}

export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {}

// Appointment Types
export type AppointmentStatus = 'SCHEDULED' | 'OTP_SENT' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  clientId: string;
  client: Client;
  engineerId: string;
  engineer: Engineer;
  visitDate: string;
  purpose?: string | null;
  siteAddress?: string | null;
  googleMapsLink?: string | null;
  otpMobileNumber?: string | null;
  status: AppointmentStatus;
  otp?: string | null;
  otpSentAt?: string | null;
  otpExpiresAt?: string | null;
  otpAttempts: number;
  verifiedAt?: string | null;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  clientId: string;
  engineerId: string;
  visitDate: string;
  purpose?: string;
  siteAddress?: string;
  googleMapsLink?: string;
  otpMobileNumber?: string;
}

// Inventory Types
export type TransactionType = 'STOCK_IN' | 'STOCK_OUT';

export interface InventoryTransaction {
  id: string;
  materialId: string;
  material: Material;
  transactionType: TransactionType;
  quantity: number;
  clientId?: string | null;
  client?: Client | null;
  siteAddress?: string | null;
  appointmentId?: string | null;
  appointment?: Appointment | null;
  remarks?: string | null;
  transactionDate: string;
  createdBy: string;
  createdByUser: User;
  createdAt: string;
  updatedAt: string;
}

export interface StockBalance {
  materialId: string;
  material: Material;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  reorderLevel?: number | null;
  isLowStock: boolean;
}

export interface CreateStockInDto {
  materialId: string;
  quantity: number;
  remarks?: string;
  transactionDate?: string;
}

export interface CreateStockOutDto {
  materialId: string;
  quantity: number;
  clientId?: string;
  siteAddress?: string;
  appointmentId?: string;
  remarks?: string;
  transactionDate?: string;
}

// Worker Visit Types
export type VisitStatus = 'PENDING' | 'OTP_VERIFIED' | 'COMPLETED';

export interface WorkerVisit {
  id: string;
  clientId: string;
  client: Client;
  engineerId: string;
  engineer: Engineer;
  visitDate: string;
  siteAddress?: string | null;
  otp?: string | null;
  otpSentAt?: string | null;
  otpExpiresAt?: string | null;
  status: VisitStatus;
  verifiedAt?: string | null;
  workerCount?: number | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerVisitDto {
  clientId: string;
  engineerId: string;
  visitDate: string;
  siteAddress?: string;
}

export interface SubmitWorkerCountDto {
  workerCount: number;
  otp: string;
  remarks?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalAppointments: number;
  pendingVerifications: number;
  completedToday: number;
  upcomingAppointments: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}
