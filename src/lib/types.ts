export type UserRole = "client" | "provider" | "admin";
export type VerificationStatus = "awaiting_verification" | "verified" | "rejected" | "suspended";
export type PaymentStatus = "pending" | "successful" | "failed" | "cancelled";
export type JobStatus =
  | "request_submitted"
  | "payment_verified"
  | "awaiting_assignment"
  | "provider_assigned"
  | "provider_accepted"
  | "work_in_progress"
  | "work_completed"
  | "client_confirmation"
  | "completed"
  | "cancelled";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number | null;
  active: boolean | null;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number | null;
  active: boolean | null;
}

export interface Service {
  id: number;
  subcategoryId: number;
  categoryId: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  imageUrl: string | null;
  gallery: string | null;
  price?: number | null; // Null means Contact / Negotiable
  features?: string | null;
  estimatedPriceRange?: string | null;
  pricingType?: string | null;
  featured: boolean | null;
  sortOrder: number | null;
  active: boolean | null;
}

export interface SelectedServiceItem {
  id: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string | null;
  price?: number | null;
  isNegotiable?: boolean;
}

export interface ProviderProfession {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number | null;
  active: boolean | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  active?: boolean | null;
  sortOrder?: number | null;
}

export interface Review {
  id: number;
  clientName: string;
  rating: number;
  comment: string | null;
  location: string | null;
  featured?: boolean | null;
}

export interface User {
  id: number;
  role: UserRole;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  location?: string | null;
  address?: string | null;
  professionId?: number | null;
  professionName?: string | null;
  experienceYears?: number | null;
  qualifications?: string | null;
  idDocumentUrl?: string | null;
  bio?: string | null;
  verificationStatus: VerificationStatus;
  verified: boolean | null;
  createdAt?: string | null;
}

export interface ServiceRequest {
  id: number;
  requestCode?: string | null;
  userId: number | null;
  fullName: string;
  email: string;
  phone: string | null;
  serviceId: number | null;
  categoryId: number | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  selectedServices: string | null;
  description: string;
  location: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  urgency: string | null;
  
  // Financial info
  bookingFee?: number | null;
  servicesTotal?: number | null;
  totalAmount?: number | null;
  paymentStatus?: PaymentStatus | null;
  paymentRef?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;

  // Provider assignment
  assignedProviderId?: number | null;
  providerName?: string | null;
  providerPhone?: string | null;
  providerProfession?: string | null;

  // Lifecycle
  jobStatus: JobStatus;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  statusNote: string | null;
  clientConfirmed?: boolean | null;

  // Timestamps
  assignedAt?: string | null;
  acceptedAt?: string | null;
  workStartedAt?: string | null;
  workCompletedAt?: string | null;
  completedAt?: string | null;
  createdAt: string | null;
}

export interface JobMessage {
  id: number;
  requestId: number;
  senderId: number | null;
  senderRole: UserRole;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ProjectGalleryItem {
  id: number;
  serviceId: number | null;
  categoryId: number | null;
  title: string;
  description: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  location: string | null;
  featured: boolean | null;
}

export interface FAQ {
  id: number;
  categoryId: number | null;
  question: string;
  answer: string;
  sortOrder: number | null;
  active?: boolean | null;
}

export interface ServiceArea {
  id: number;
  name: string;
  state: string;
  active: boolean | null;
}

export interface Notification {
  id: number;
  userId: number | null;
  userRole?: UserRole | null;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  linkUrl: string | null;
  createdAt: string | null;
}

export type NavigateFunction = (route: PageRoute) => void;

export type PageRoute =
  | { type: "tab" }
  | { type: "category"; category: Category }
  | { type: "subcategory"; subcategory: Subcategory; category: Category }
  | { type: "service"; service: Service; category: Category }
  | { type: "request"; service?: Service; category?: Category; preselectedServices?: SelectedServiceItem[] }
  | { type: "gallery" }
  | { type: "faq" }
  | { type: "notifications" }
  | { type: "profile" }
  | { type: "areas" }
  | { type: "provider_dashboard" };
