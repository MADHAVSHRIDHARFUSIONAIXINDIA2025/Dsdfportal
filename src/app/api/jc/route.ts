import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { JointClosure } from "@/models";

// List JC for a ticket
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");
    const customerId = searchParams.get("customerId");

    const query: Record<string, unknown> = {};
    if (ticketId) query.ticketId = ticketId;
    if (customerId) query.customerId = customerId;

    const jcs = await JointClosure.find(query)
      .populate("engineerId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const result = jcs.map((jc) => ({
      id: String(jc._id),
      ticketId: String(jc.ticketId),
      customerId: String(jc.customerId),
      engineerId: String(jc.engineerId),
      engineer: (jc.engineerId as { name?: string })?.name || "",
      latitude: jc.latitude,
      longitude: jc.longitude,
      imageUrl: jc.imageUrl,
      remarks: jc.remarks || "",
      createdAt: jc.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[jc:list]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load JC records" },
      { status: 500 }
    );
  }
}

// Add new JC
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();

    const formData = await request.formData();
    const ticketId = formData.get("ticketId") as string;
    const customerId = formData.get("customerId") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const remarks = formData.get("remarks") as string;
    const image = formData.get("image") as File | null;

    if (!ticketId || !customerId || !latitude || !longitude || !image) {
      return NextResponse.json(
        { error: "Ticket, customer, lat/long, and image are required" },
        { status: 400 }
      );
    }

    // Upload image to S3
    const uploaded = await uploadToS3(image, "jc");

    const jc = await JointClosure.create({
      ticketId,
      customerId,
      engineerId: user.engineerId || user.id,
      latitude,
      longitude,
      imageUrl: uploaded.url,
      remarks: remarks || "",
    });

    const populated = await JointClosure.findById(jc._id)
      .populate("engineerId", "name")
      .lean();

    return NextResponse.json({
      id: String(populated!._id),
      ticketId: String(populated!.ticketId),
      customerId: String(populated!.customerId),
      engineerId: String(populated!.engineerId),
      engineer: (populated!.engineerId as { name?: string })?.name || "",
      latitude: populated!.latitude,
      longitude: populated!.longitude,
      imageUrl: populated!.imageUrl,
      remarks: populated!.remarks || "",
      createdAt: populated!.createdAt,
    });
  } catch (error) {
    console.error("[jc:create]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create JC record" },
      { status: 500 }
    );
  }
}
