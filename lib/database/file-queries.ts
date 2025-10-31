import { query } from "./db";

export interface RequestFileData {
  id: string;
  request_id: string;
  request_type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: Buffer;
  uploaded_at: Date;
}

export async function createRequestFile(data: {
  requestId: string;
  requestType: "exchange" | "internal";
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
}): Promise<RequestFileData> {
  const result = await query(
    `INSERT INTO request_files 
     (request_id, request_type, file_name, file_type, file_size, file_data)
     VALUES ($1, $2, $3, $4, $5, decode($6, 'base64'))
     RETURNING *`,
    [data.requestId, data.requestType, data.fileName, data.fileType, data.fileSize, data.fileData],
  );

  return result.rows[0];
}

export async function getRequestFilesByRequestId(requestId: string): Promise<RequestFileData[]> {
  const result = await query(
    "SELECT * FROM request_files WHERE request_id = $1 ORDER BY uploaded_at ASC",
    [requestId],
  );

  return result.rows;
}

export async function getRequestFileById(id: string): Promise<RequestFileData | null> {
  const result = await query("SELECT * FROM request_files WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function deleteRequestFile(id: string): Promise<void> {
  await query("DELETE FROM request_files WHERE id = $1", [id]);
}
