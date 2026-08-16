import { db } from "@/db";
import {
  categories, subcategories, services, banners, reviews,
  serviceRequests, projectGallery, faqs, serviceAreas,
  notifications, users, providerProfessions, systemSettings,
} from "@/db/schema";
import { eq, desc, asc, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { alertJobStatusUpdate, alertMilestonePhoto } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";


// Helper to push notification to client
async function dispatchNotification({
  userId,
  userEmail,
  title,
  message,
  type = "request_update",
  requestId,
}: {
  userId?: number | null;
  userEmail?: string | null;
  title: string;
  message: string;
  type?: string;
  requestId?: number | null;
}) {
  const notifObj = {
    id: Date.now(),
    userId: userId || null,
    userEmail: userEmail || null,
    title,
    message,
    type,
    requestId: requestId || null,
    read: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.insert(notifications).values({
      userId: notifObj.userId,
      title: notifObj.title,
      message: notifObj.message,
      type: notifObj.type,
      read: false,
    });
  } catch (e) {}

  if (!(serverStore as any).notifications) {
    (serverStore as any).notifications = [];
  }
  (serverStore as any).notifications.unshift(notifObj);
}

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table");

  try {
    switch (table) {
      case "stats": {
        try {
          const [catCount] = await db.select({ c: count() }).from(categories);
          const [svcCount] = await db.select({ c: count() }).from(services);
          const [reqCount] = await db.select({ c: count() }).from(serviceRequests);
          const [allUsers] = await db.select({ c: count() }).from(users);
          const clientCount = await db.select({ c: count() }).from(users).where(eq(users.role, "client"));
          const providerCount = await db.select({ c: count() }).from(users).where(eq(users.role, "provider"));
          const pendingApps = await db.select({ c: count() }).from(users).where(eq(users.verificationStatus, "awaiting_verification"));
          const verifiedProviders = await db.select({ c: count() }).from(users).where(eq(users.verificationStatus, "verified"));
          const pendingReqs = await db.select({ c: count() }).from(serviceRequests).where(eq(serviceRequests.status, "pending"));
          const activeJobs = await db.select({ c: count() }).from(serviceRequests).where(eq(serviceRequests.status, "in_progress"));
          const completedJobs = await db.select({ c: count() }).from(serviceRequests).where(eq(serviceRequests.status, "completed"));

          const allReqs = await db.select().from(serviceRequests);
          const combinedReqs = allReqs.length > 0 ? allReqs : serverStore.requests;

          const totalBookingFees = combinedReqs.filter(r => r.paymentStatus === "successful").reduce((acc, curr) => acc + (curr.bookingFee || 5000), 0);
          const totalRevenue = combinedReqs.filter(r => r.paymentStatus === "successful").reduce((acc, curr) => acc + (curr.totalAmount || 5000), 0);
          const pendingPayments = combinedReqs.filter(r => r.paymentStatus !== "successful").length;

          return NextResponse.json({
            categories: catCount?.c || serverStore.categories.length,
            services: svcCount?.c || serverStore.services.length,
            requests: reqCount?.c || combinedReqs.length,
            users: allUsers?.c || serverStore.users.length,
            clients: clientCount[0]?.c || serverStore.users.filter(u => u.role === "client").length,
            providers: providerCount[0]?.c || serverStore.users.filter(u => u.role === "provider").length,
            pendingApplications: pendingApps[0]?.c || serverStore.users.filter(u => u.verificationStatus === "awaiting_verification").length,
            verifiedProviders: verifiedProviders[0]?.c || serverStore.users.filter(u => u.role === "provider" && u.verificationStatus === "verified").length,
            pendingRequests: pendingReqs[0]?.c || combinedReqs.filter(r => r.jobStatus === "awaiting_admin_review" || r.status === "pending").length,
            activeJobs: activeJobs[0]?.c || combinedReqs.filter(r => r.jobStatus === "work_in_progress" || r.jobStatus === "provider_assigned").length,
            completedJobs: completedJobs[0]?.c || combinedReqs.filter(r => r.jobStatus === "completed" || r.status === "completed").length,
            bookingFeesTotal: totalBookingFees,
            totalRevenue: totalRevenue,
            pendingPayments: pendingPayments,
            bookingFeeConfig: serverStore.bookingFee || 5000,
          });
        } catch (err) {
          const clients = serverStore.users.filter(u => u.role === "client").length;
          const providers = serverStore.users.filter(u => u.role === "provider").length;
          const pendingApps = serverStore.users.filter(u => u.verificationStatus === "awaiting_verification").length;
          const verified = serverStore.users.filter(u => u.role === "provider" && u.verificationStatus === "verified").length;
          const activeJobs = serverStore.requests.filter(r => r.jobStatus === "work_in_progress" || r.jobStatus === "provider_assigned").length;
          const completed = serverStore.requests.filter(r => r.jobStatus === "completed" || r.status === "completed").length;
          const totalFees = serverStore.requests.reduce((a, b) => a + (b.bookingFee || 5000), 0);
          const totalRev = serverStore.requests.reduce((a, b) => a + (b.totalAmount || 5000), 0);

          return NextResponse.json({
            categories: serverStore.categories.length,
            services: serverStore.services.length,
            requests: serverStore.requests.length,
            users: serverStore.users.length,
            clients,
            providers,
            pendingApplications: pendingApps,
            verifiedProviders: verified,
            pendingRequests: serverStore.requests.filter(r => r.jobStatus === "awaiting_admin_review" || r.status === "pending").length,
            activeJobs,
            completedJobs,
            bookingFeesTotal: totalFees,
            totalRevenue: totalRev,
            pendingPayments: 0,
            bookingFeeConfig: serverStore.bookingFee || 5000,
          });
        }
      }

      case "provider_applications": {
        try {
          const provs = await db
            .select()
            .from(users)
            .where(eq(users.role, "provider"))
            .orderBy(desc(users.createdAt));
          if (provs && provs.length > 0) return NextResponse.json(provs);
        } catch (e) {}
        return NextResponse.json(serverStore.users.filter(u => u.role === "provider"));
      }

      case "verified_providers": {
        try {
          const vprovs = await db
            .select({
              id: users.id,
              fullName: users.fullName,
              professionName: users.professionName,
              phone: users.phone,
              location: users.location,
            })
            .from(users)
            .where(eq(users.role, "provider"))
            .where(eq(users.verificationStatus, "verified"));
          if (vprovs && vprovs.length > 0) return NextResponse.json(vprovs);
        } catch (e) {}
        return NextResponse.json(
          serverStore.users
            .filter(u => u.role === "provider" && u.verificationStatus === "verified")
            .map(u => ({
              id: u.id,
              fullName: u.fullName,
              professionName: u.professionName || "Certified Specialist",
              phone: u.phone,
              location: u.location,
            }))
        );
      }

      case "professions": {
        try {
          const profs = await db.select().from(providerProfessions).orderBy(asc(providerProfessions.sortOrder));
          if (profs && profs.length > 0) return NextResponse.json(profs);
        } catch (e) {}
        return NextResponse.json(serverStore.professions);
      }

      case "categories": {
        try {
          const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
          if (cats && cats.length > 0) return NextResponse.json(cats);
        } catch (e) {}
        return NextResponse.json(serverStore.categories);
      }

      case "subcategories": {
        try {
          const subs = await db.select().from(subcategories).orderBy(asc(subcategories.sortOrder));
          if (subs && subs.length > 0) return NextResponse.json(subs);
        } catch (e) {}
        return NextResponse.json(serverStore.subcategories);
      }

      case "services": {
        try {
          const svcs = await db
            .select({
              id: services.id,
              name: services.name,
              slug: services.slug,
              shortDescription: services.shortDescription,
              fullDescription: services.fullDescription,
              categoryId: services.categoryId,
              subcategoryId: services.subcategoryId,
              imageUrl: services.imageUrl,
              price: services.price,
              featured: services.featured,
              active: services.active,
              sortOrder: services.sortOrder,
              categoryName: categories.name,
              subcategoryName: subcategories.name,
            })
            .from(services)
            .leftJoin(categories, eq(services.categoryId, categories.id))
            .leftJoin(subcategories, eq(services.subcategoryId, subcategories.id))
            .orderBy(asc(services.sortOrder));
          if (svcs && svcs.length > 0) return NextResponse.json(svcs);
        } catch (e) {}
        return NextResponse.json(serverStore.services);
      }

      case "requests":
      case "job_requests": {
        try {
          const reqs = await db
            .select({
              id: serviceRequests.id,
              requestCode: serviceRequests.requestCode,
              userId: serviceRequests.userId,
              fullName: serviceRequests.fullName,
              email: serviceRequests.email,
              phone: serviceRequests.phone,
              description: serviceRequests.description,
              selectedServices: serviceRequests.selectedServices,
              location: serviceRequests.location,
              address: serviceRequests.address,
              preferredDate: serviceRequests.preferredDate,
              preferredTime: serviceRequests.preferredTime,
              urgency: serviceRequests.urgency,
              bookingFee: serviceRequests.bookingFee,
              servicesTotal: serviceRequests.servicesTotal,
              totalAmount: serviceRequests.totalAmount,
              paymentStatus: serviceRequests.paymentStatus,
              paymentRef: serviceRequests.paymentRef,
              paymentMethod: serviceRequests.paymentMethod,
              paidAt: serviceRequests.paidAt,
              assignedProviderId: serviceRequests.assignedProviderId,
              providerName: serviceRequests.providerName,
              providerPhone: serviceRequests.providerPhone,
              providerProfession: serviceRequests.providerProfession,
              jobStatus: serviceRequests.jobStatus,
              status: serviceRequests.status,
              statusNote: serviceRequests.statusNote,
              clientConfirmed: serviceRequests.clientConfirmed,
              createdAt: serviceRequests.createdAt,
              categoryName: categories.name,
            })
            .from(serviceRequests)
            .leftJoin(categories, eq(serviceRequests.categoryId, categories.id))
            .orderBy(desc(serviceRequests.createdAt));
          if (reqs && reqs.length > 0) return NextResponse.json(reqs);
        } catch (e) {}
        return NextResponse.json(serverStore.requests);
      }

      case "gallery": {
        try {
          const gal = await db.select().from(projectGallery).orderBy(desc(projectGallery.createdAt));
          if (gal && gal.length > 0) return NextResponse.json(gal);
        } catch (e) {}
        return NextResponse.json(serverStore.gallery);
      }

      case "payments": {
        try {
          const pays = await db
            .select({
              id: serviceRequests.id,
              requestCode: serviceRequests.requestCode,
              clientName: serviceRequests.fullName,
              email: serviceRequests.email,
              paymentRef: serviceRequests.paymentRef,
              paymentMethod: serviceRequests.paymentMethod,
              bookingFee: serviceRequests.bookingFee,
              servicesTotal: serviceRequests.servicesTotal,
              totalAmount: serviceRequests.totalAmount,
              paymentStatus: serviceRequests.paymentStatus,
              paidAt: serviceRequests.paidAt,
              createdAt: serviceRequests.createdAt,
            })
            .from(serviceRequests)
            .orderBy(desc(serviceRequests.createdAt));
          if (pays && pays.length > 0) return NextResponse.json(pays);
        } catch (e) {}
        return NextResponse.json(
          serverStore.requests.map(r => ({
            id: r.id,
            requestCode: r.requestCode || `QM-REQ-${r.id}`,
            clientName: r.fullName,
            email: r.email,
            paymentRef: r.paymentRef || "QM-PAY-VERIFIED",
            paymentMethod: r.paymentMethod || "card",
            bookingFee: r.bookingFee || 5000,
            servicesTotal: r.servicesTotal || 0,
            totalAmount: r.totalAmount || 5000,
            paymentStatus: r.paymentStatus || "successful",
            paidAt: r.paidAt || r.createdAt,
            createdAt: r.createdAt,
          }))
        );
      }

      case "banners": {
        try {
          const b = await db.select().from(banners).orderBy(asc(banners.sortOrder));
          if (b && b.length > 0) return NextResponse.json(b);
        } catch (e) {}
        return NextResponse.json(serverStore.banners);
      }

      case "notifications": {
        try {
          const n = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
          if (n && n.length > 0) return NextResponse.json(n);
        } catch (e) {}
        return NextResponse.json((serverStore as any).notifications || []);
      }

      case "reviews": {
        try {
          const r = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
          if (r && r.length > 0) return NextResponse.json(r);
        } catch (e) {}
        return NextResponse.json(serverStore.reviews);
      }

      case "users": {
        try {
          const u = await db.select().from(users).orderBy(desc(users.createdAt));
          if (u && u.length > 0) return NextResponse.json(u);
        } catch (e) {}
        return NextResponse.json(serverStore.users);
      }

      case "faqs": {
        try {
          const f = await db.select().from(faqs).orderBy(asc(faqs.sortOrder));
          if (f && f.length > 0) return NextResponse.json(f);
        } catch (e) {}
        return NextResponse.json(serverStore.faqs);
      }

      case "areas": {
        try {
          const a = await db.select().from(serviceAreas).orderBy(asc(serviceAreas.name));
          if (a && a.length > 0) return NextResponse.json(a);
        } catch (e) {}
        return NextResponse.json(serverStore.areas);
      }

      case "settings":
        return NextResponse.json({ bookingFee: serverStore.bookingFee || 5000 });

      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
  } catch (e) {
    console.error("Admin GET error:", e);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// POST: Create records (Single or Bulk)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, data, photos, action } = body;

    // Send direct client feedback
    if (action === "send_feedback" || table === "send_feedback") {
      const { requestId, userEmail, clientName, title, message, type = "admin_feedback" } = data;
      await dispatchNotification({
        userEmail,
        title: title || `Update on your QuestMore Service Request`,
        message: message || "Admin has sent an update regarding your service request.",
        type,
        requestId,
      });

      // Also update status note in the request if present
      if (requestId) {
        serverStore.requests = serverStore.requests.map(r =>
          r.id === Number(requestId) ? { ...r, statusNote: message } : r
        );
        try {
          await db.update(serviceRequests).set({ statusNote: message }).where(eq(serviceRequests.id, Number(requestId)));
        } catch (e) {}
      }

      return NextResponse.json({ success: true, message: "Feedback sent directly to client notification center" });
    }

    switch (table) {
      case "services": {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const newService = {
          name: data.name,
          slug,
          shortDescription: data.shortDescription || null,
          fullDescription: data.fullDescription || null,
          categoryId: Number(data.categoryId),
          subcategoryId: data.subcategoryId ? Number(data.subcategoryId) : null,
          imageUrl: data.imageUrl || null,
          price: data.price ? Number(data.price) : null,
          featured: data.featured === "true" || data.featured === true,
          active: data.active === "false" || data.active === false ? false : true,
          sortOrder: data.sortOrder ? Number(data.sortOrder) : serverStore.services.length + 1,
        };

        try {
          const [inserted] = await db.insert(services).values(newService).returning();
          if (inserted) {
            serverStore.services.push(inserted);
            return NextResponse.json(inserted);
          }
        } catch (e) {}

        const fallback = { id: Date.now(), ...newService };
        serverStore.services.push(fallback);
        return NextResponse.json(fallback);
      }

      case "gallery": {
        if (photos && Array.isArray(photos)) {
          const createdPhotos: any[] = [];
          for (const p of photos) {
            const record = {
              title: p.title || "Certified Engineering Project",
              description: p.description || null,
              beforeImageUrl: p.beforeImageUrl || p.imageUrl || null,
              afterImageUrl: p.afterImageUrl || p.imageUrl || null,
              location: p.location || "Abuja",
              featured: true,
            };
            try {
              const [ins] = await db.insert(projectGallery).values(record).returning();
              if (ins) {
                createdPhotos.push(ins);
                serverStore.gallery.unshift(ins);
              }
            } catch (e) {
              const fallback = { id: Date.now() + Math.random(), ...record, createdAt: new Date().toISOString() };
              createdPhotos.push(fallback);
              serverStore.gallery.unshift(fallback);
            }
          }
          return NextResponse.json({ success: true, photos: createdPhotos });
        }

        const singleRecord = {
          title: data.title || "Engineering Transformation",
          description: data.description || null,
          beforeImageUrl: data.beforeImageUrl || data.imageUrl || null,
          afterImageUrl: data.afterImageUrl || data.imageUrl || null,
          location: data.location || "Abuja",
          featured: data.featured === "false" || data.featured === false ? false : true,
        };
        try {
          const [inserted] = await db.insert(projectGallery).values(singleRecord).returning();
          if (inserted) {
            serverStore.gallery.unshift(inserted);
            return NextResponse.json(inserted);
          }
        } catch (e) {}
        const fallback = { id: Date.now(), ...singleRecord, createdAt: new Date().toISOString() };
        serverStore.gallery.unshift(fallback);
        return NextResponse.json(fallback);
      }

      case "banners": {
        const bannerRecord = {
          title: data.title || "Specialist Dispatch",
          subtitle: data.subtitle || null,
          imageUrl: data.imageUrl || "/hero_engineering.jpg",
          link: data.link || null,
          active: data.active === "false" || data.active === false ? false : true,
          sortOrder: data.sortOrder ? Number(data.sortOrder) : serverStore.banners.length + 1,
        };
        try {
          const [ins] = await db.insert(banners).values(bannerRecord).returning();
          if (ins) {
            serverStore.banners.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newB = { id: Date.now(), ...bannerRecord };
        serverStore.banners.push(newB);
        return NextResponse.json(newB);
      }

      case "notifications": {
        const notifRecord = {
          title: String(data.title).trim(),
          message: String(data.message).trim(),
          type: data.type || "announcement",
          userEmail: data.userEmail || null,
          userId: data.userId ? Number(data.userId) : null,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await dispatchNotification(notifRecord);
        return NextResponse.json({ success: true, notification: notifRecord });
      }

      case "professions": {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const profData = {
          name: data.name,
          slug,
          description: data.description || null,
          icon: data.icon || "🔧",
          sortOrder: data.sortOrder ? Number(data.sortOrder) : serverStore.professions.length + 1,
          active: data.active === "false" || data.active === false ? false : true,
        };
        try {
          const [inserted] = await db.insert(providerProfessions).values(profData).returning();
          if (inserted) {
            serverStore.professions.push(inserted);
            return NextResponse.json(inserted);
          }
        } catch (e) {}
        const newP = { id: Date.now(), ...profData };
        serverStore.professions.push(newP);
        return NextResponse.json(newP);
      }

      case "categories": {
        const catData = {
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: data.description || null,
          icon: data.icon || "building",
          imageUrl: data.imageUrl || null,
          sortOrder: Number(data.sortOrder || 0),
          active: data.active === "false" ? false : true,
        };
        try {
          const [ins] = await db.insert(categories).values(catData).returning();
          if (ins) {
            serverStore.categories.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newC = { id: Date.now(), ...catData };
        serverStore.categories.push(newC);
        return NextResponse.json(newC);
      }

      case "subcategories": {
        const subData = {
          categoryId: Number(data.categoryId),
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: data.description || null,
          sortOrder: Number(data.sortOrder || 0),
          active: data.active === "false" ? false : true,
        };
        try {
          const [ins] = await db.insert(subcategories).values(subData).returning();
          if (ins) {
            serverStore.subcategories.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newS = { id: Date.now(), ...subData };
        serverStore.subcategories.push(newS);
        return NextResponse.json(newS);
      }

      case "reviews": {
        try {
          const [ins] = await db.insert(reviews).values(data).returning();
          if (ins) {
            serverStore.reviews.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newR = { id: Date.now(), ...data };
        serverStore.reviews.push(newR);
        return NextResponse.json(newR);
      }

      case "faqs": {
        try {
          const [ins] = await db.insert(faqs).values(data).returning();
          if (ins) {
            serverStore.faqs.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newF = { id: Date.now(), ...data };
        serverStore.faqs.push(newF);
        return NextResponse.json(newF);
      }

      case "areas": {
        try {
          const [ins] = await db.insert(serviceAreas).values(data).returning();
          if (ins) {
            serverStore.areas.push(ins);
            return NextResponse.json(ins);
          }
        } catch (e) {}
        const newA = { id: Date.now(), ...data };
        serverStore.areas.push(newA);
        return NextResponse.json(newA);
      }

      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
  } catch (e) {
    console.error("Admin POST error:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PUT: Update records
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, id, data } = body;

    switch (table) {
      case "provider_applications":
      case "users": {
        const updateFields: Record<string, any> = {};
        if (data.verificationStatus) {
          updateFields.verificationStatus = data.verificationStatus;
          updateFields.verified = data.verificationStatus === "verified";
        }
        if (data.role) updateFields.role = data.role;
        if (data.fullName) updateFields.fullName = data.fullName;
        if (data.phone) updateFields.phone = data.phone;
        if (data.location) updateFields.location = data.location;
        if (data.professionName) updateFields.professionName = data.professionName;

        try {
          await db
            .update(users)
            .set(updateFields)
            .where(eq(users.id, Number(id)));
        } catch (e) {}

        serverStore.users = serverStore.users.map(u =>
          u.id === Number(id) ? { ...u, ...updateFields } : u
        );

        // If provider was approved, notify them
        if (data.verificationStatus === "verified") {
          const prov = serverStore.users.find(u => u.id === Number(id));
          if (prov?.email) {
            await dispatchNotification({
              userEmail: prov.email,
              title: "Trade Certification Verified! 🎉",
              message: "Congratulations! Your QuestMore service provider credentials have been verified. You are now eligible for specialist job dispatch.",
              type: "announcement",
            });
          }
        }

        return NextResponse.json({ success: true });
      }

      case "requests":
      case "job_requests": {
        const updateFields: Record<string, any> = {};
        let currentReq: any = serverStore.requests.find(r => r.id === Number(id));

        if (data.assignedProviderId) {
          const providerId = Number(data.assignedProviderId);
          let providerObj: any = serverStore.users.find(u => u.id === providerId);
          try {
            const pDb = await db.select().from(users).where(eq(users.id, providerId)).limit(1);
            if (pDb.length > 0) providerObj = pDb[0];
          } catch (e) {}

          updateFields.assignedProviderId = providerId;
          updateFields.providerName = providerObj?.fullName || data.providerName || "Verified Specialist";
          updateFields.providerPhone = providerObj?.phone || data.providerPhone || null;
          updateFields.providerProfession = providerObj?.professionName || data.providerProfession || null;
          updateFields.jobStatus = "provider_assigned";
          updateFields.assignedAt = new Date();
          updateFields.status = "confirmed";
          updateFields.statusNote = `Assigned to ${updateFields.providerName} (${updateFields.providerProfession || "Specialist"}). Awaiting specialist dispatch.`;

          // Auto-notify client (in-app + WhatsApp)
          if (currentReq?.email) {
            await dispatchNotification({
              userEmail: currentReq.email,
              title: "Specialist Assigned to Your Job 👷",
              message: `Specialist ${updateFields.providerName} (${updateFields.providerProfession || "Certified Engineer"}) has been assigned to your request ${currentReq.requestCode || ""}.`,
              type: "request_update",
              requestId: Number(id),
            });
          }
          // WhatsApp alert for provider assignment
          alertJobStatusUpdate({
            clientPhone: currentReq?.phone || null,
            clientName: currentReq?.fullName || "Valued Client",
            requestCode: currentReq?.requestCode || `QM-REQ-${id}`,
            newStatus: "provider_assigned",
            providerName: updateFields.providerName,
            providerPhone: updateFields.providerPhone,
          }).catch(() => {});
        }

        if (data.jobStatus) {
          updateFields.jobStatus = data.jobStatus;
          if (data.jobStatus === "completed") {
            updateFields.status = "completed";
            updateFields.completedAt = new Date();
          } else if (data.jobStatus === "work_in_progress") {
            updateFields.status = "in_progress";
            updateFields.workStartedAt = new Date();
          }

          // Auto-notify client on status updates
          if (currentReq?.email) {
            const statusLabels: Record<string, string> = {
              awaiting_assignment: "Your request has been approved and is queued for specialist assignment.",
              provider_accepted: "Your assigned engineer has accepted the job and is preparing tools/materials.",
              work_in_progress: "Specialist is on site and work is currently in progress.",
              work_completed: "Work is marked complete! Please inspect and confirm completion on your Activity tab.",
              completed: "Job successfully confirmed and signed off! Thank you for choosing QuestMore.",
            };
            if (statusLabels[data.jobStatus]) {
              await dispatchNotification({
                userEmail: currentReq.email,
                title: `Job Status: ${data.jobStatus.replace(/_/g, " ").toUpperCase()}`,
                message: statusLabels[data.jobStatus],
                type: "request_update",
                requestId: Number(id),
              });
              // WhatsApp alert for status change
              alertJobStatusUpdate({
                clientPhone: currentReq?.phone || null,
                clientName: currentReq?.fullName || "Valued Client",
                requestCode: currentReq?.requestCode || `QM-REQ-${id}`,
                newStatus: data.jobStatus,
                providerName: currentReq?.providerName,
                providerPhone: currentReq?.providerPhone,
                statusNote: data.statusNote,
              }).catch(() => {});
            }
          }
        }

        // ── Milestone photo action ─────────────────────────────
        if (data.action === "add_milestone_photo" && data.stage && data.url) {
          const existingPhotos = (() => {
            try { return JSON.parse(currentReq?.milestonePhotos || "[]"); }
            catch { return []; }
          })();

          const newPhoto = {
            stage: data.stage,
            stageLabel: data.stageLabel || data.stage,
            url: data.url,
            caption: data.caption || "",
            uploadedAt: new Date().toISOString(),
          };

          // Replace existing photo for same stage OR add new
          const filtered = existingPhotos.filter((p: any) => p.stage !== data.stage);
          const updatedPhotos = JSON.stringify([...filtered, newPhoto]);
          updateFields.milestonePhotos = updatedPhotos;

          // WhatsApp alert for milestone photo
          alertMilestonePhoto({
            clientPhone: currentReq?.phone || null,
            clientName: currentReq?.fullName || "Valued Client",
            requestCode: currentReq?.requestCode || `QM-REQ-${id}`,
            stageLabel: newPhoto.stageLabel,
          }).catch(() => {});
        }
        // ──────────────────────────────────────────────────────

        if (data.status) updateFields.status = data.status;
        if (data.statusNote) updateFields.statusNote = data.statusNote;
        if (data.totalAmount !== undefined) updateFields.totalAmount = Number(data.totalAmount);
        if (data.servicesTotal !== undefined) updateFields.servicesTotal = Number(data.servicesTotal);

        // If quote is submitted for negotiable scope
        if (data.quotedPrice && currentReq?.email) {
          await dispatchNotification({
            userEmail: currentReq.email,
            title: `Quotation Ready: ₦${Number(data.quotedPrice).toLocaleString()}`,
            message: `Admin has reviewed your requirements for ${currentReq.requestCode || "your request"} and quoted ₦${Number(data.quotedPrice).toLocaleString()}. View your Activity tab to approve & proceed.`,
            type: "request_update",
            requestId: Number(id),
          });
        }

        try {
          await db
            .update(serviceRequests)
            .set(updateFields)
            .where(eq(serviceRequests.id, Number(id)));
        } catch (e) {}

        serverStore.requests = serverStore.requests.map(r =>
          r.id === Number(id) ? { ...r, ...updateFields } : r
        );
        return NextResponse.json({ success: true });
      }

      case "banners": {
        const updateFields: Record<string, any> = {};
        if (data.title !== undefined) updateFields.title = data.title;
        if (data.subtitle !== undefined) updateFields.subtitle = data.subtitle;
        if (data.imageUrl !== undefined) updateFields.imageUrl = data.imageUrl;
        if (data.link !== undefined) updateFields.link = data.link;
        if (data.sortOrder !== undefined) updateFields.sortOrder = Number(data.sortOrder);
        if (data.active !== undefined) updateFields.active = data.active === "true" || data.active === true;

        try {
          await db.update(banners).set(updateFields).where(eq(banners.id, Number(id)));
        } catch (e) {}

        serverStore.banners = serverStore.banners.map(b =>
          b.id === Number(id) ? { ...b, ...updateFields } : b
        );
        return NextResponse.json({ success: true });
      }

      case "services": {
        const updateFields: Record<string, any> = {};
        if (data.name) updateFields.name = data.name;
        if (data.shortDescription !== undefined) updateFields.shortDescription = data.shortDescription;
        if (data.fullDescription !== undefined) updateFields.fullDescription = data.fullDescription;
        if (data.imageUrl) updateFields.imageUrl = data.imageUrl;
        if (data.price !== undefined) {
          updateFields.price = data.price === "" || data.price === null ? null : Number(data.price);
        }
        if (data.featured !== undefined) updateFields.featured = data.featured === "true" || data.featured === true;
        if (data.active !== undefined) updateFields.active = data.active === "true" || data.active === true;
        if (data.categoryId) updateFields.categoryId = Number(data.categoryId);
        if (data.subcategoryId) updateFields.subcategoryId = Number(data.subcategoryId);
        if (data.sortOrder !== undefined) updateFields.sortOrder = Number(data.sortOrder);

        try {
          await db
            .update(services)
            .set(updateFields)
            .where(eq(services.id, Number(id)));
        } catch (e) {}

        serverStore.services = serverStore.services.map(s =>
          s.id === Number(id) ? { ...s, ...updateFields } : s
        );
        return NextResponse.json({ success: true });
      }

      case "gallery": {
        const updateFields: Record<string, any> = {
          title: data.title,
          description: data.description,
          beforeImageUrl: data.beforeImageUrl,
          afterImageUrl: data.afterImageUrl,
          location: data.location,
          featured: data.featured === "true" || data.featured === true,
        };
        try {
          await db.update(projectGallery).set(updateFields).where(eq(projectGallery.id, Number(id)));
        } catch (e) {}
        serverStore.gallery = serverStore.gallery.map(g =>
          g.id === Number(id) ? { ...g, ...updateFields } : g
        );
        return NextResponse.json({ success: true });
      }

      case "settings": {
        if (data.bookingFee) {
          serverStore.bookingFee = Number(data.bookingFee);
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: true });
    }
  } catch (e) {
    console.error("Admin PUT error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE: Remove records
export async function DELETE(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table");
  const id = req.nextUrl.searchParams.get("id");

  if (!table || !id) {
    return NextResponse.json({ error: "Missing table or id" }, { status: 400 });
  }

  const numId = Number(id);

  try {
    switch (table) {
      case "services":
        try { await db.delete(services).where(eq(services.id, numId)); } catch (e) {}
        serverStore.services = serverStore.services.filter(s => s.id !== numId);
        break;
      case "gallery":
        try { await db.delete(projectGallery).where(eq(projectGallery.id, numId)); } catch (e) {}
        serverStore.gallery = serverStore.gallery.filter(g => g.id !== numId);
        break;
      case "banners":
        try { await db.delete(banners).where(eq(banners.id, numId)); } catch (e) {}
        serverStore.banners = serverStore.banners.filter(b => b.id !== numId);
        break;
      case "notifications":
        try { await db.delete(notifications).where(eq(notifications.id, numId)); } catch (e) {}
        if ((serverStore as any).notifications) {
          (serverStore as any).notifications = (serverStore as any).notifications.filter((n: any) => n.id !== numId);
        }
        break;
      case "professions":
        try { await db.delete(providerProfessions).where(eq(providerProfessions.id, numId)); } catch (e) {}
        serverStore.professions = serverStore.professions.filter(p => p.id !== numId);
        break;
      case "categories":
        try { await db.delete(categories).where(eq(categories.id, numId)); } catch (e) {}
        serverStore.categories = serverStore.categories.filter(c => c.id !== numId);
        break;
      case "subcategories":
        try { await db.delete(subcategories).where(eq(subcategories.id, numId)); } catch (e) {}
        serverStore.subcategories = serverStore.subcategories.filter(s => s.id !== numId);
        break;
      case "reviews":
        try { await db.delete(reviews).where(eq(reviews.id, numId)); } catch (e) {}
        serverStore.reviews = serverStore.reviews.filter(r => r.id !== numId);
        break;
      case "faqs":
        try { await db.delete(faqs).where(eq(faqs.id, numId)); } catch (e) {}
        serverStore.faqs = serverStore.faqs.filter(f => f.id !== numId);
        break;
      case "areas":
        try { await db.delete(serviceAreas).where(eq(serviceAreas.id, numId)); } catch (e) {}
        serverStore.areas = serverStore.areas.filter(a => a.id !== numId);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
