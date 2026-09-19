"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Field, Input, Textarea } from "./Field";
import { MapPin, Camera, Loader2 } from "lucide-react";

type JCRecord = {
  id: string;
  engineer: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
  remarks: string;
  createdAt: string;
};

type JCAddProps = {
  ticketId: string;
  customerId: string;
  records: JCRecord[];
  onAdd: (record: JCRecord) => void;
};

export function JCAdd({ ticketId, customerId, records, onAdd }: JCAddProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [remarks, setRemarks] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  function getLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image || !latitude || !longitude) {
      setError("Image, latitude, and longitude are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("ticketId", ticketId);
      formData.append("customerId", customerId);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("remarks", remarks);
      formData.append("image", image);

      const res = await fetch("/api/jc", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add JC");
      }

      const newRecord = await res.json();
      onAdd(newRecord);

      // Reset form
      setLatitude("");
      setLongitude("");
      setRemarks("");
      setImage(null);
      setPreview("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add JC");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Joint Closures ({records.length})
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
        >
          {open ? "Cancel" : "+ Add JC"}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-2xl border border-line bg-canvas p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Latitude *">
              <div className="flex gap-2">
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="12.345678"
                  required
                />
                <Button type="button" variant="secondary" onClick={getLocation} title="Get current location">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </Field>
            <Field label="Longitude *">
              <Input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.123456"
                required
              />
            </Field>
          </div>

          <Field label="JC Image *">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-white px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-brand hover:bg-blue-50 hover:text-brand">
              <Camera className="h-4 w-4" />
              {image ? image.name : "Choose image"}
              <input
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </label>
          </Field>

          {preview && (
            <div className="overflow-hidden rounded-xl">
              <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
            </div>
          )}

          <Field label="Remarks">
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes about this JC"
              rows={2}
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding JC...
              </>
            ) : (
              "Add Joint Closure"
            )}
          </Button>
        </form>
      )}

      {records.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-canvas text-left">
              <tr>
                <th className="p-3 font-semibold">Engineer</th>
                <th className="p-3 font-semibold">Lat / Long</th>
                <th className="p-3 font-semibold">Image</th>
                <th className="p-3 font-semibold">Remarks</th>
                <th className="p-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((jc) => (
                <tr key={jc.id} className="border-b border-line last:border-0">
                  <td className="p-3">{jc.engineer}</td>
                  <td className="p-3">
                    <a
                      href={`https://www.google.com/maps?q=${jc.latitude},${jc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {jc.latitude}, {jc.longitude}
                    </a>
                  </td>
                  <td className="p-3">
                    <a
                      href={jc.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      View Image
                    </a>
                  </td>
                  <td className="p-3 text-muted">{jc.remarks || "—"}</td>
                  <td className="p-3 text-muted">
                    {new Date(jc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
