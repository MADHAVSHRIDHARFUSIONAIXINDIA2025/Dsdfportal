"use client";

import { useState } from "react";
import { Upload, X, File, Loader2 } from "lucide-react";
import { Button } from "./Button";

type Attachment = {
  name: string;
  url: string;
  size: number;
  uploadedBy?: string;
  uploadedAt?: string;
};

type FileUploadProps = {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
};

export function FileUpload({ attachments, onChange, disabled, maxFiles = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        const uploaded = await res.json();
        newAttachments.push(uploaded);
      }

      onChange([...attachments, ...newAttachments]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
        Attachments ({attachments.length}/{maxFiles})
      </label>

      {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-line bg-canvas p-2">
              <File className="h-4 w-4 flex-shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-brand hover:underline"
                >
                  {att.name}
                </a>
                <p className="text-xs text-muted">
                  {formatSize(att.size)}
                  {att.uploadedBy && ` • ${att.uploadedBy}`}
                </p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="flex-shrink-0 rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-ink"
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && attachments.length < maxFiles && (
        <div className="mt-2">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-canvas px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-brand hover:bg-blue-50 hover:text-brand ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Click to upload files
              </>
            )}
            <input
              type="file"
              className="sr-only"
              multiple
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
          </label>
          <p className="mt-1 text-xs text-muted">Images, PDFs, documents up to 10MB</p>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
