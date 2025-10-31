"use client";

import { useState, useRef } from "react";
import { Upload, X, File } from "lucide-react";
import toast from "react-hot-toast";
import { validateFile } from "@/lib/utils/file-validation";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface FileWithId extends File {
  id: string;
}

export function FileUploader({
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Check total files limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: FileWithId[] = [];
    for (const file of selectedFiles) {
      const validation = validateFile(file.name, file.type, file.size);

      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      // Add unique ID
      const fileWithId = Object.assign(file, {
        id: `${Date.now()}-${Math.random()}`,
      });

      validFiles.push(fileWithId);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onClick={() => !disabled && files.length < maxFiles && fileInputRef.current?.click()}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center 
          rounded-lg border-2 border-dashed p-6 transition-colors
          ${disabled || files.length >= maxFiles
            ? "cursor-not-allowed border-gray-300 opacity-50"
            : "border-outline hover:border-accent hover:bg-accent/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          multiple
          disabled={disabled || files.length >= maxFiles}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className="mb-2 h-10 w-10 text-foregroundMuted" />

        <p className="text-sm font-medium">
          {files.length >= maxFiles
            ? "Maximum files reached"
            : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-foregroundMuted">
          PDF, Excel, Word, TXT, CSV (max 10MB per file)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-outline bg-surface p-3"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <File className="h-4 w-4 flex-shrink-0 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-foregroundMuted">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file.id);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <p className="text-xs text-foregroundMuted">
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

