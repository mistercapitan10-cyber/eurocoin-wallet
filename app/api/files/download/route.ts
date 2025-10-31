import { NextRequest, NextResponse } from "next/server";
import { getRequestFileById } from "@/lib/database/file-queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Fetch file from database
    const file = await getRequestFileById(fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert Buffer to ArrayBuffer
    const buffer =
      file.file_data instanceof Buffer
        ? file.file_data
        : Buffer.from(file.file_data, "base64");

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.file_type,
        "Content-Disposition": `inline; filename="${file.file_name}"`,
        "Content-Length": file.file_size.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

