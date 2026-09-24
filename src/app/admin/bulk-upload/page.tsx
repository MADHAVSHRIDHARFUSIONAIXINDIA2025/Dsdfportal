"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useRef, useState } from "react";

type BulkSummary = {
  created: Record<string, number>;
  updated: Record<string, number>;
  failed: Record<string, number>;
  results: Array<{ sheet: string; row: number; ok: boolean; message: string }>;
};

const SHEETS = ["Companies", "Links", "Engineers", "Tickets"] as const;

export default function BulkUploadPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  async function downloadTemplate() {
    try {
      const res = await fetch("/api/bulk/template");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Template download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DSDF-bulk-upload-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.push("Template downloaded");
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Download failed", "error");
    }
  }

  async function upload() {
    if (!file) {
      toast.push("Choose an Excel file first", "error");
      return;
    }
    setUploading(true);
    setSummary(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/bulk/upload", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Upload failed");
      setSummary(body as BulkSummary);
      const failed = Object.values((body as BulkSummary).failed).reduce((a, b) => a + b, 0);
      toast.push(failed ? `Import finished with ${failed} row error(s)` : "Import completed", failed ? "error" : "ok");
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  const failedRows = summary?.results.filter((r) => !r.ok) || [];

  return (
    <div>
      <PageIntro
        title="Bulk upload"
        subtitle="Download the Excel template, fill Companies → Links → Engineers → Tickets, then upload."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-ink">1. Download template</h3>
          <p className="mt-2 text-sm text-muted">
            Four sheets with headers and one sample row each. Required columns are marked with *. Do not rename
            sheet names or the header row.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>Companies — name, contact, email, address</li>
            <li>Links — customer + company name + city (Link ID required only for Vodafone Idea Limited)</li>
            <li>Engineers — name + mobile (password optional)</li>
            <li>Tickets — ticket no; match links by Link ID or Customer Name; engineers by mobile</li>
          </ul>
          <Button className="mt-4" onClick={downloadTemplate}>
            Download Excel template
          </Button>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-ink">2. Upload filled file</h3>
          <p className="mt-2 text-sm text-muted">
            Existing companies (by name), links (by Link ID), engineers (by mobile), and tickets (by ticket no)
            are updated. New rows are created.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="mt-4 block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setSummary(null);
            }}
          />
          {file ? <p className="mt-2 text-xs text-muted">{file.name}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={upload} disabled={uploading || !file}>
              {uploading ? "Importing…" : "Upload & import"}
            </Button>
            <Button
              variant="ghost"
              disabled={uploading}
              onClick={() => {
                setFile(null);
                setSummary(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear
            </Button>
          </div>
        </Card>
      </div>

      {summary ? (
        <Card className="mt-5 p-5">
          <h3 className="font-bold text-ink">Import summary</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHEETS.map((sheet) => (
              <div key={sheet} className="rounded-2xl bg-canvas p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{sheet}</p>
                <p className="mt-2 text-sm text-ink">
                  Created {summary.created[sheet] || 0} · Updated {summary.updated[sheet] || 0}
                </p>
                <div className="mt-2">
                  <Badge tone={(summary.failed[sheet] || 0) > 0 ? "amber" : "green"}>
                    {(summary.failed[sheet] || 0) > 0 ? `${summary.failed[sheet]} failed` : "OK"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {failedRows.length ? (
            <div className="mt-5 overflow-x-auto">
              <p className="mb-2 text-sm font-semibold text-ink">Row errors</p>
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="px-2 py-2 font-medium">Sheet</th>
                    <th className="px-2 py-2 font-medium">Row</th>
                    <th className="px-2 py-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {failedRows.map((row, i) => (
                    <tr key={`${row.sheet}-${row.row}-${i}`} className="border-b border-line/60">
                      <td className="px-2 py-2">{row.sheet}</td>
                      <td className="px-2 py-2">{row.row}</td>
                      <td className="px-2 py-2 text-red-700">{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">All rows imported successfully.</p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
