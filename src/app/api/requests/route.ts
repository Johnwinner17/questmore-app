import { db } from "@/db";
import { serviceRequests, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const email = req.nextUrl.searchParams.get("email");

  try {
    const data = await db
      .select({
        id: serviceRequests.id,
        requestCode: serviceRequests.requestCode,
        userId: serviceRequests.userId,
        fullName: serviceRequests.fullName,
        email: serviceRequests.email,
        phone: serviceRequests.phone,
        serviceId: serviceRequests.serviceId,
        categoryId: serviceRequests.categoryId,
        selectedServices: serviceRequests.selectedServices,
        description: serviceRequests.description,
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
        assignedAt: serviceRequests.assignedAt,
        acceptedAt: serviceRequests.acceptedAt,
        workStartedAt: serviceRequests.workStartedAt,
        workCompletedAt: serviceRequests.workCompletedAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(serviceRequests)
      .leftJoin(categories, eq(serviceRequests.categoryId, categories.id))
      .orderBy(desc(serviceRequests.createdAt));

    if (data && data.length > 0) {
      if (email) {
        const filtered = data.filter(d => d.email && d.email.toLowerCase() === email.toLowerCase());
        return NextResponse.json(filtered);
      }
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("DB query fallback in /api/requests:", e);
  }

  // Fallback to serverStore real requests
  const storeRequests = serverStore.requests || [];
  if (email) {
    const filtered = storeRequests.filter(d => d.email && d.email.toLowerCase() === email.toLowerCase());
    return NextResponse.json(filtered);
  }

  return NextResponse.json(storeRequests);
}
