import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverStore } from "@/lib/server-store";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://questmore_user:WVhlJXfTDxPT8ThXzQlqt3UyVuI6KVgR@dpg-da0dfqtbedkc73ahbjcg-a.oregon-postgres.render.com:5432/questmore_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __dbInitialized?: boolean;
};

// SSL configuration for Cloud PostgreSQL
const isCloudDb =
  databaseUrl.includes("render.com") ||
  databaseUrl.includes("neon.tech") ||
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("dpg-") ||
  databaseUrl.includes("sslmode=require") ||
  process.env.NODE_ENV === "production";

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INITIALIZATION, SELF-HEALING MIGRATIONS & DATA PERSISTENCE ENGINE
// Ensures all PostgreSQL tables and columns exist and auto-seeds/syncs services.
// ─────────────────────────────────────────────────────────────────────────────
export async function ensureDbInitialized(): Promise<boolean> {
  if (globalForDb.__dbInitialized) return true;

  try {
    const client = await pool.connect();
    try {
      // 1. Create tables if not present
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          role VARCHAR(50) NOT NULL DEFAULT 'client',
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(50),
          password_hash VARCHAR(255),
          avatar_url TEXT,
          location VARCHAR(255),
          address TEXT,
          profession_name VARCHAR(255),
          profession_id INTEGER,
          experience_years INTEGER,
          years_of_experience INTEGER,
          qualifications TEXT,
          id_document_url TEXT,
          government_id_type VARCHAR(100),
          government_id_number VARCHAR(100),
          government_id_url TEXT,
          proof_of_address_url TEXT,
          certification_urls TEXT,
          verification_status VARCHAR(50) DEFAULT 'awaiting_verification',
          verified BOOLEAN DEFAULT FALSE,
          skills TEXT,
          portfolio TEXT,
          rating VARCHAR(10) DEFAULT '5.0',
          completed_jobs_count INTEGER DEFAULT 0,
          bio TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          user_email VARCHAR(255),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'system',
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(100),
          image_url TEXT,
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS subcategories (
          id SERIAL PRIMARY KEY,
          category_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(100),
          image_url TEXT,
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          subcategory_id INTEGER,
          category_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          short_description TEXT,
          full_description TEXT,
          image_url TEXT,
          gallery TEXT,
          features TEXT,
          price INTEGER,
          featured BOOLEAN DEFAULT FALSE,
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS service_requests (
          id SERIAL PRIMARY KEY,
          request_code VARCHAR(100) UNIQUE,
          user_id INTEGER,
          category_id INTEGER,
          subcategory_id INTEGER,
          service_id INTEGER,
          selected_services TEXT,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          location VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          description TEXT NOT NULL,
          preferred_date VARCHAR(50),
          preferred_time VARCHAR(50),
          urgency VARCHAR(50) DEFAULT 'standard',
          booking_fee INTEGER DEFAULT 5000,
          services_total INTEGER DEFAULT 0,
          total_amount INTEGER DEFAULT 5000,
          quoted_cost INTEGER,
          payment_status VARCHAR(50) DEFAULT 'successful',
          payment_ref VARCHAR(255),
          payment_method VARCHAR(50) DEFAULT 'card',
          paid_at TIMESTAMP DEFAULT NOW(),
          assigned_provider_id INTEGER,
          provider_name VARCHAR(255),
          provider_phone VARCHAR(50),
          provider_profession VARCHAR(255),
          job_status VARCHAR(50) DEFAULT 'awaiting_admin_review',
          status VARCHAR(50) DEFAULT 'pending',
          status_note TEXT,
          milestone_photos TEXT,
          assigned_at TIMESTAMP,
          work_started_at TIMESTAMP,
          completed_at TIMESTAMP,
          client_confirmed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS banners (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle TEXT,
          image_url TEXT,
          link TEXT,
          link_url TEXT,
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          rating INTEGER DEFAULT 5,
          comment TEXT,
          location VARCHAR(255),
          service_id INTEGER,
          featured BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'general',
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS service_areas (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          state VARCHAR(100) NOT NULL DEFAULT 'FCT (Abuja)',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS provider_professions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category_id INTEGER,
          description TEXT,
          icon VARCHAR(100) DEFAULT '🔧',
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_gallery (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          before_image_url TEXT,
          after_image_url TEXT,
          location VARCHAR(255),
          featured BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 2. Self-Healing Schema Alterations (guarantee all columns exist without crashing)
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS qualifications TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_url TEXT;

        ALTER TABLE services ADD COLUMN IF NOT EXISTS features TEXT;
        ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_price_range VARCHAR(255);
        ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50) DEFAULT 'quote';

        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS milestone_photos TEXT;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP;
        ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS quoted_cost INTEGER;

        ALTER TABLE banners ADD COLUMN IF NOT EXISTS link TEXT;
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url TEXT;

        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target VARCHAR(50) DEFAULT 'specific';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'client';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
      `);

      // 3. Auto-seed Categories if table is empty
      const catCount = await client.query("SELECT COUNT(*) FROM categories");
      if (parseInt(catCount.rows[0].count) === 0) {
        for (const cat of serverStore.categories) {
          await client.query(
            `INSERT INTO categories (id, name, slug, description, icon, image_url, sort_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, image_url = EXCLUDED.image_url`,
            [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.imageUrl, cat.sortOrder, cat.active]
          );
        }
      }

      // 4. Auto-seed/Sync Services if services table is empty
      const svcCount = await client.query("SELECT COUNT(*) FROM services");
      if (parseInt(svcCount.rows[0].count) === 0) {
        for (const svc of serverStore.services) {
          await client.query(
            `INSERT INTO services (id, subcategory_id, category_id, name, slug, short_description, full_description, image_url, price, featured, sort_order, active, features)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET 
               name = EXCLUDED.name,
               category_id = EXCLUDED.category_id,
               short_description = EXCLUDED.short_description,
               full_description = EXCLUDED.full_description,
               image_url = EXCLUDED.image_url,
               price = EXCLUDED.price,
               featured = EXCLUDED.featured,
               sort_order = EXCLUDED.sort_order,
               active = EXCLUDED.active,
               features = EXCLUDED.features`,
            [
              svc.id,
              svc.subcategoryId || null,
              svc.categoryId,
              svc.name,
              svc.slug,
              svc.shortDescription,
              svc.fullDescription,
              svc.imageUrl,
              svc.price ?? null,
              svc.featured ?? false,
              svc.sortOrder ?? 0,
              svc.active ?? true,
              svc.features ? JSON.stringify(svc.features) : null,
            ]
          );
        }
      }

      // 5. Auto-seed Banners if empty
      const banCount = await client.query("SELECT COUNT(*) FROM banners");
      if (parseInt(banCount.rows[0].count) === 0) {
        for (const b of serverStore.banners) {
          await client.query(
            `INSERT INTO banners (id, title, subtitle, image_url, link, link_url, sort_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, image_url = EXCLUDED.image_url`,
            [b.id, b.title, b.subtitle, b.imageUrl, b.link || "/explore", b.link || "/explore", b.sortOrder || 1, b.active !== false]
          );
        }
      }

      globalForDb.__dbInitialized = true;
      console.log("✅ [QuestMore DB] PostgreSQL database successfully initialized and synchronized!");
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("[QuestMore DB] Auto-initialization warning:", err);
    return false;
  }
}
