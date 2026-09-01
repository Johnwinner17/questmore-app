import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

// Top-level categories (e.g., Construction, Electrical, Plumbing)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subcategories (e.g., under Construction: Foundation, Roofing, Finishing)
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual services (now with optional fixed price; null = negotiable)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  subcategoryId: integer("subcategory_id").notNull(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  imageUrl: text("image_url"),
  gallery: text("gallery"),
  price: integer("price"), // Optional fixed price in Naira (e.g. 20000). If null, treat as Negotiable.
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider Professions (Admin can add, edit, disable, delete)
export const providerProfessions = pgTable("provider_professions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings (e.g. Booking Fee default 5000 NGN)
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Homepage banners / promotions
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client reviews / testimonials
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientAvatar: text("client_avatar"),
  serviceId: integer("service_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  location: varchar("location", { length: 255 }),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users (Clients, Service Providers, and Admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).default("client"), // 'client' | 'provider' | 'admin'
  fullName: varchar("full_name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // for service providers
  avatarUrl: text("avatar_url"),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  // Service Provider specific fields:
  professionId: integer("profession_id"),
  professionName: varchar("profession_name", { length: 255 }),
  experienceYears: integer("experience_years"),
  qualifications: text("qualifications"),
  idDocumentUrl: text("id_document_url"),
  bio: text("bio"),
  // Verification: 'awaiting_verification' | 'verified' | 'rejected' | 'suspended'
  verificationStatus: varchar("verification_status", { length: 50 }).default("awaiting_verification"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User addresses
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: varchar("label", { length: 100 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User favorites
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serviceId: integer("service_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service requests / Jobs (Full lifecycle & financial breakdown)
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  requestCode: varchar("request_code", { length: 50 }), // e.g. QM-REQ-4829
  userId: integer("user_id"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  serviceId: integer("service_id"),
  categoryId: integer("category_id"),
  selectedServices: text("selected_services"), // JSON array: [{ id, name, categoryName, price, isNegotiable }]
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  preferredDate: date("preferred_date"),
  preferredTime: varchar("preferred_time", { length: 50 }),
  urgency: varchar("urgency", { length: 50 }),
  
  // Financial breakdown
  bookingFee: integer("booking_fee").default(5000), // Fixed 5000 NGN default
  servicesTotal: integer("services_total").default(0), // Total of fixed-price services
  totalAmount: integer("total_amount").default(5000), // bookingFee + servicesTotal
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // 'pending' | 'successful' | 'failed' | 'cancelled'
  paymentRef: varchar("payment_ref", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 50 }), // 'card' | 'transfer' | 'ussd'
  paidAt: timestamp("paid_at"),

  // Provider assignment
  assignedProviderId: integer("assigned_provider_id"),
  providerName: varchar("provider_name", { length: 255 }),
  providerPhone: varchar("provider_phone", { length: 50 }),
  providerProfession: varchar("provider_profession", { length: 100 }),

  // Full 8-step Job Workflow:
  // request_submitted -> payment_verified -> awaiting_assignment -> provider_assigned ->
  // provider_accepted -> work_in_progress -> work_completed -> client_confirmation -> completed (or cancelled)
  jobStatus: varchar("job_status", { length: 50 }).default("request_submitted"),
  status: requestStatusEnum("status").default("pending"), // legacy compatibility
  statusNote: text("status_note"),
  clientConfirmed: boolean("client_confirmed").default(false),

  // Timestamps
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  workStartedAt: timestamp("work_started_at"),
  workCompletedAt: timestamp("work_completed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),

  // Milestone progress photos (JSON array: [{ stage, stageLabel, url, caption, uploadedAt }])
  milestonePhotos: text("milestone_photos"),
});

// Job Messages / In-Request Chat (Unlocked after payment)
export const jobMessages = pgTable("job_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  senderId: integer("sender_id"),
  senderRole: varchar("sender_role", { length: 50 }).notNull(), // 'client' | 'provider' | 'admin'
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project gallery (before/after)
export const projectGallery = pgTable("project_gallery", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id"),
  categoryId: integer("category_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  beforeImageUrl: text("before_image_url"),
  afterImageUrl: text("after_image_url"),
  location: varchar("location", { length: 255 }),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// FAQs
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service areas
export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userEmail: varchar("user_email", { length: 255 }), // targeted recipient email (null = broadcast)
  userRole: varchar("user_role", { length: 50 }).default("client"), // 'client' | 'provider' | 'admin' | 'all'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }),
  target: varchar("target", { length: 50 }).default("specific"), // 'specific' | 'all' | 'clients' | 'providers'
  read: boolean("read").default(false),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
