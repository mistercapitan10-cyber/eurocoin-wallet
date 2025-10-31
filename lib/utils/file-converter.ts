export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:mime/type;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function convertFilesToBase64(files: File[]): Promise<
  Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
  }>
> {
  const convertedFiles = [];

  for (const file of files) {
    const base64 = await convertFileToBase64(file);

    convertedFiles.push({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64,
    });
  }

  return convertedFiles;
}

