import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverStore } from "@/lib/server-store";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/questmore";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __dbInitialized?: boolean;
};

// SSL configuration:
// - Render internal host (dpg-xxx without .render.com) DOES NOT use SSL (internal private network TCP)
// - External Render host (xxx.oregon-postgres.render.com) or external clouds DO use SSL
const isExternalCloudDb =
  databaseUrl.includes("render.com") ||
  databaseUrl.includes("neon.tech") ||
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("sslmode=require");

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isExternalCloudDb ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INITIALIZATION & PERSISTENCE ENGINE
// Ensures all PostgreSQL tables exist and auto-seeds/syncs platform services.
// ─────────────────────────────────────────────────────────────────────────────
export async function ensureDbInitialized(): Promise<boolean> {
  if (globalForDb.__dbInitialized) return true;

  try {
    const client = await pool.connect();
    try {
      // 1. Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          role VARCHAR(50) NOT NULL DEFAULT 'client',
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(50),
          avatar_url TEXT,
          location VARCHAR(255),
          address TEXT,
          profession_name VARCHAR(255),
          profession_id INTEGER,
          years_of_experience INTEGER,
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
          subcategory_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          short_description TEXT,
          full_description TEXT,
          image_url TEXT,
          gallery TEXT,
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
          client_confirmed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS banners (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle TEXT,
          image_url TEXT,
          link_url TEXT,
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          rating INTEGER DEFAULT 5,
          comment TEXT NOT NULL,
          service_name VARCHAR(255),
          location VARCHAR(255),
          avatar_url TEXT,
          status VARCHAR(50) DEFAULT 'approved',
          featured BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'General',
          sort_order INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS service_areas (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          state VARCHAR(100) DEFAULT 'Abuja (FCT)',
          coverage_type VARCHAR(50) DEFAULT 'primary',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS provider_professions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(100),
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
          category VARCHAR(100),
          image_url TEXT NOT NULL,
          caption TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 2. Sync / Upsert Categories
      for (const c of serverStore.categories) {
        await client.query(
          `INSERT INTO categories (id, name, slug, description, icon, image_url, sort_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon,
             image_url = EXCLUDED.image_url,
             sort_order = EXCLUDED.sort_order,
             active = EXCLUDED.active`,
          [c.id, c.name, c.slug, c.description, c.icon, c.imageUrl, c.sortOrder || 0, true]
        );
      }

      // 3. Sync / Upsert Subcategories
      for (const s of serverStore.subcategories) {
        await client.query(
          `INSERT INTO subcategories (id, category_id, name, slug, description, icon, image_url, sort_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             category_id = EXCLUDED.category_id,
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon,
             image_url = EXCLUDED.image_url,
             sort_order = EXCLUDED.sort_order,
             active = EXCLUDED.active`,
          [s.id, s.categoryId, s.name, s.slug, s.description, s.icon, s.imageUrl, s.sortOrder || 0, true]
        );
      }

      // 4. Sync / Upsert all 16 Negotiated Services
      for (const s of serverStore.services) {
        await client.query(
          `INSERT INTO services (id, subcategory_id, category_id, name, slug, short_description, full_description, image_url, gallery, price, featured, sort_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             subcategory_id = EXCLUDED.subcategory_id,
             category_id = EXCLUDED.category_id,
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             short_description = EXCLUDED.short_description,
             full_description = EXCLUDED.full_description,
             image_url = EXCLUDED.image_url,
             gallery = EXCLUDED.gallery,
             price = EXCLUDED.price,
             featured = EXCLUDED.featured,
             sort_order = EXCLUDED.sort_order,
             active = EXCLUDED.active`,
          [s.id, s.subcategoryId, s.categoryId, s.name, s.slug, s.shortDescription, s.fullDescription, s.imageUrl, s.gallery, s.price || null, s.featured || false, s.sortOrder || 0, true]
        );
      }

      // 5. Sync / Upsert Professions
      for (const p of serverStore.professions) {
        await client.query(
          `INSERT INTO provider_professions (id, name, slug, description, icon, sort_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon,
             sort_order = EXCLUDED.sort_order,
             active = EXCLUDED.active`,
          [p.id, p.name, p.slug, p.description, p.icon, p.sortOrder || 0, true]
        );
      }

      // Reset auto-increment sequences
      await client.query(`
        SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 0) + 1, false) FROM categories;
        SELECT setval(pg_get_serial_sequence('subcategories', 'id'), coalesce(max(id), 0) + 1, false) FROM subcategories;
        SELECT setval(pg_get_serial_sequence('services', 'id'), coalesce(max(id), 0) + 1, false) FROM services;
        SELECT setval(pg_get_serial_sequence('provider_professions', 'id'), coalesce(max(id), 0) + 1, false) FROM provider_professions;
      `);

      globalForDb.__dbInitialized = true;
      console.log("[QuestMore DB] PostgreSQL tables initialized and ready with 16 negotiated services.");
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[QuestMore DB] Failed to auto-initialize PostgreSQL:", err);
    return false;
  }
}

// Trigger initialization in background on import
ensureDbInitialized().catch(() => {});
