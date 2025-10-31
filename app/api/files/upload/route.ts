import { NextRequest, NextResponse } from "next/server";
import { createRequestFile } from "@/lib/database/file-queries";
import { validateFile, getMaxFilesPerRequest } from "@/lib/utils/file-validation";

interface FileUploadRequest {
  requestId: string;
  requestType: "exchange" | "internal";
  files: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const data: FileUploadRequest = await request.json();

    // Validate request
    if (!data.requestId || !data.requestType) {
      return NextResponse.json(
        { error: "requestId and requestType are required" },
        { status: 400 },
      );
    }

    if (!data.files || data.files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    if (data.files.length > getMaxFilesPerRequest()) {
      return NextResponse.json(
        { error: `Maximum ${getMaxFilesPerRequest()} files allowed` },
        { status: 400 },
      );
    }

    // Validate each file
    for (const file of data.files) {
      const validation = validateFile(file.fileName, file.fileType, file.fileSize);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Save files to database
    const savedFiles = [];
    for (const file of data.files) {
      const savedFile = await createRequestFile({
        requestId: data.requestId,
        requestType: data.requestType,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileData: file.fileData,
      });
      savedFiles.push(savedFile);
    }

    return NextResponse.json({
      success: true,
      files: savedFiles.map((f) => ({
        id: f.id,
        fileName: f.file_name,
        fileType: f.file_type,
        fileSize: f.file_size,
      })),
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}

