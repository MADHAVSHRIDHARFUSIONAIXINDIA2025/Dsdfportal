import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadToS3, isS3Configured } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "File uploads not configured. Contact admin to set up AWS S3." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Validate file type (images, PDFs, common docs)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use images, PDFs, or common document formats." },
        { status: 400 }
      );
    }

    const result = await uploadToS3(file, "tickets");

    return NextResponse.json({
      name: file.name,
      url: result.url,
      size: file.size,
      uploadedBy: user.name,
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
