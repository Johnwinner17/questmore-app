import { db, ensureDbInitialized } from "@/db";
import { serviceRequests, notifications } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import type { ServiceRequest } from "@/lib/types";
import { serverStore } from "@/lib/server-store";
import { alertNewBooking } from "@/lib/whatsapp";


export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const {
      serviceId,
      categoryId,
      services,
      fullName,
      email,
      phone,
      location,
      address,
      description,
      preferredDate,
      preferredTime,
      urgency,
      paymentMethod = "card",
      paymentStatus = "successful",
      paymentRef,
      userId,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Client name and email are required" },
        { status: 400 }
      );
    }

    const BOOKING_FEE = serverStore.bookingFee || 5000;

    let servicesTotal = 0;
    let servicesArr = [];

    if (Array.isArray(services) && services.length > 0) {
      servicesArr = services;
      services.forEach((s: any) => {
        if (s.price && typeof s.price === "number" && !s.isNegotiable) {
          servicesTotal += s.price;
        }
      });
    }

    const totalAmount = servicesTotal + BOOKING_FEE;
    const requestCode = `QM-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalPaymentRef = paymentRef || `QM-PAY-${Date.now().toString().slice(-8)}`;
    const selectedServicesJson = JSON.stringify(servicesArr);

    const newRequestData = {
      requestCode,
      userId: userId ? Number(userId) : null,
      fullName,
      email,
      phone: phone || null,
      serviceId: serviceId ? Number(serviceId) : (servicesArr[0]?.id || null),
      categoryId: categoryId ? Number(categoryId) : (servicesArr[0]?.categoryId || null),
      selectedServices: selectedServicesJson,
      description: description || `Service request for: ${servicesArr.map((s: any) => s.name).join(", ")}`,
      location: location || null,
      address: address || null,
      preferredDate: preferredDate ? String(preferredDate) : null,
      preferredTime: preferredTime || null,
      urgency: urgency || "standard",
      bookingFee: BOOKING_FEE,
      servicesTotal,
      totalAmount,
      paymentStatus: paymentStatus as any,
      paymentRef: finalPaymentRef,
      paymentMethod,
      paidAt: paymentStatus === "successful" ? new Date() : null,
      jobStatus: paymentStatus === "successful" ? "awaiting_admin_review" : "request_submitted",
      status: "pending" as const,
      statusNote: paymentStatus === "successful"
        ? "Payment received. Your job request is awaiting QuestMore Admin review and approval before a provider is assigned."
        : "Awaiting payment verification.",
      clientConfirmed: false,
    };

    let insertedId = Date.now();

    try {
      const [inserted] = await db
        .insert(serviceRequests)
        .values(newRequestData as any)
        .returning();

      if (inserted) {
        insertedId = inserted.id;
      }

      // Create Admin & Client Notification
      try {
        await db.insert(notifications).values([
          {
            userId: userId ? Number(userId) : null,
            userRole: "client",
            title: "Request Received & Pending Review",
            message: `Your service request ${requestCode} (₦${totalAmount.toLocaleString()}) has been received. Admin is reviewing scope.`,
            type: "payment",
            linkUrl: "/activity",
          },
          {
            userId: 1, // Admin
            userRole: "admin",
            title: "New Client Request Pending Review",
            message: `Client ${fullName} submitted request ${requestCode} (₦${totalAmount.toLocaleString()}).`,
            type: "request",
            linkUrl: "/admin",
          },
        ]);
      } catch (notifErr) {
        // Continue
      }
    } catch (insertErr) {
      console.warn("DB insert fallback in /api/request:", insertErr);
    }

    const savedRecord = {
      id: insertedId,
      ...newRequestData,
      createdAt: new Date().toISOString(),
    };

    // Store in global store so Admin and Activity tab instantly access it
    serverStore.requests.unshift(savedRecord as any);

    // ── WhatsApp / SMS Alerts ───────────────────────────────
    // Fire-and-forget: don't block the response on alert delivery
    const serviceNames =
      servicesArr.length > 0
        ? servicesArr.map((s: any) => s.name).join(", ")
        : "General Engineering Service";

    alertNewBooking({
      clientPhone: phone || null,
      clientName: fullName,
      requestCode: savedRecord.requestCode,
      totalAmount,
      services: serviceNames,
    }).catch(() => {});
    // ───────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      requestId: insertedId,
      requestCode: savedRecord.requestCode,
      totalAmount,
      paymentStatus,
    });
  } catch (error) {
    console.error("Service request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}

// PUT: Client confirms job completion
export async function PUT(req: NextRequest) {
  try {
    const { action, requestId } = await req.json();

    if (action === "confirm_completion" && requestId) {
      const updateData = {
        jobStatus: "completed",
        status: "completed" as const,
        clientConfirmed: true,
        completedAt: new Date(),
        statusNote: "Job successfully completed, inspected, and signed off with QA warranty.",
      };

      try {
        await db
          .update(serviceRequests)
          .set(updateData)
          .where(serviceRequests.id.eq(Number(requestId)));
      } catch (dbErr) {
        console.warn("DB update fallback in /api/request PUT:", dbErr);
      }

      // Update in serverStore
      serverStore.requests = serverStore.requests.map(r =>
        r.id === Number(requestId) ? { ...r, ...updateData } : r
      );

      return NextResponse.json({ success: true, message: "Completion confirmed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
