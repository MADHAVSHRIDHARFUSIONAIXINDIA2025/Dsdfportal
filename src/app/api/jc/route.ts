import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isS3Configured, uploadToS3 } from "@/lib/s3";
import { JointClosure, Ticket } from "@/models";

function mapJc(jc: Record<string, unknown>) {
  const eng =
    jc.engineerId && typeof jc.engineerId === "object"
      ? (jc.engineerId as { name?: string; _id?: unknown })
      : null;
  return {
    id: String(jc._id),
    ticketId: jc.ticketId ? String(jc.ticketId) : "",
    customerId: jc.customerId ? String(jc.customerId) : "",
    engineerId: eng?._id ? String(eng._id) : jc.engineerId ? String(jc.engineerId) : "",
    engineer: eng?.name || String(jc.addedBy || "Engineer"),
    latitude: String(jc.latitude || ""),
    longitude: String(jc.longitude || ""),
    imageUrl: String(jc.imageUrl || ""),
    remarks: String(jc.remarks || ""),
    createdAt: jc.createdAt,
  };
}

/** List JC history for a link (customer). Prefer customerId so history spans tickets. */
export async function GET(request: NextRequest) {
  try {
    await requireUser();
    await connectDB();

    const { searchParams } = new URL(request.url);
    let customerId = searchParams.get("customerId") || "";
    const ticketId = searchParams.get("ticketId") || "";

    if (!customerId && ticketId) {
      const ticket = await Ticket.findById(ticketId).select("customerId").lean();
      customerId = ticket?.customerId ? String(ticket.customerId) : "";
    }

    if (!customerId) {
      return NextResponse.json([]);
    }

    const jcs = await JointClosure.find({ customerId })
      .populate("engineerId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(jcs.map((jc) => mapJc(jc as Record<string, unknown>)));
  } catch (error) {
    console.error("[jc:list]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load JC records" },
      { status: 500 }
    );
  }
}

/** Engineer adds JC on a ticket — stored against the link for future tickets. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 is not configured. Add AWS keys to enable JC image upload." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const ticketId = (formData.get("ticketId") as string) || "";
    let customerId = (formData.get("customerId") as string) || "";
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const remarks = (formData.get("remarks") as string) || "";
    const image = formData.get("image") as File | null;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket is required to add JC" }, { status: 400 });
    }

    if (!customerId) {
      const ticket = await Ticket.findById(ticketId).select("customerId").lean();
      customerId = ticket?.customerId ? String(ticket.customerId) : "";
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "This ticket has no link. Assign a customer/link before adding JC." },
        { status: 400 }
      );
    }

    if (!latitude || !longitude || !image) {
      return NextResponse.json(
        { error: "Latitude, longitude, and image are required" },
        { status: 400 }
      );
    }

    const uploaded = await uploadToS3(image, "jc");

    const jc = await JointClosure.create({
      ticketId,
      customerId,
      ...(user.engineerId ? { engineerId: user.engineerId } : {}),
      addedBy: user.name || "Engineer",
      latitude,
      longitude,
      imageUrl: uploaded.url,
      remarks,
    });

    const populated = await JointClosure.findById(jc._id).populate("engineerId", "name").lean();
    return NextResponse.json(mapJc(populated as Record<string, unknown>));
  } catch (error) {
    console.error("[jc:create]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create JC record" },
      { status: 500 }
    );
  }
}
