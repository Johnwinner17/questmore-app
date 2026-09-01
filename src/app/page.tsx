import { db, ensureDbInitialized } from "@/db";
import { categories, banners, services, reviews } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { mockCategories, mockBanners, mockServices, mockReviews } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let allCategories = mockCategories;
  let allBanners = mockBanners;
  let featuredServices = mockServices;
  let featuredReviews = mockReviews;

  try {
    await ensureDbInitialized().catch(() => {});
    const [dbCats, dbBanners, dbServices, dbReviews] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(asc(categories.sortOrder)),
      db
        .select({
          id: banners.id,
          title: banners.title,
          subtitle: banners.subtitle,
          imageUrl: banners.imageUrl,
        })
        .from(banners)
        .where(eq(banners.active, true))
        .orderBy(asc(banners.sortOrder)),
      db
        .select()
        .from(services)
        .where(eq(services.featured, true))
        .orderBy(asc(services.sortOrder)),
      db
        .select({
          id: reviews.id,
          clientName: reviews.clientName,
          rating: reviews.rating,
          comment: reviews.comment,
          location: reviews.location,
        })
        .from(reviews)
        .where(eq(reviews.featured, true)),
    ]);

    if (dbCats.length > 0) allCategories = dbCats as any;
    if (dbBanners.length > 0) allBanners = dbBanners as any;
    if (dbServices.length > 0) featuredServices = dbServices as any;
    if (dbReviews.length > 0) featuredReviews = dbReviews as any;
  } catch (err) {
    console.warn("Database connection unavailable, using mock data fallback.");
  }

  return (
    <AppShell
      initialData={{
        categories: allCategories,
        banners: allBanners,
        featured: featuredServices,
        reviews: featuredReviews,
      }}
    />
  );
}

