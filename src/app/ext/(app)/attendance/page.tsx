"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import { post } from "@/lib/client";
import { useState } from "react";

type Row = { id: string; attDate: string; inTime: string; outTime: string; status: string; remarks: string; engineerId: string };

export default function EngineerAttendancePage() {
  const { data = [], reload } = useResource<Row[]>("/api/attendance");
  const [status, setStatus] = useState("Present");
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  async function mark(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await post("/api/attendance", {
        engineerId: "self",
        attDate: form.get("attDate") || today,
        inTime: form.get("inTime"),
        outTime: form.get("outTime"),
        status,
        remarks: form.get("remarks"),
      });
      toast.push("Attendance marked");
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Attendance" subtitle="Mark yourself present from phone or desktop." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={mark} className="space-y-4 rounded-3xl border border-line bg-white p-4 shadow-card lg:p-6">
          <Field label="Date"><Input name="attDate" type="date" defaultValue={today} required /></Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {ATTENDANCE_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="In"><Input name="inTime" type="time" /></Field>
            <Field label="Out"><Input name="outTime" type="time" /></Field>
          </div>
          <Field label="Remarks"><Input name="remarks" /></Field>
          <Button type="submit" className="w-full">Save attendance</Button>
        </form>
        <div>
          <div className="space-y-3 md:hidden">
            {data.slice(0, 12).map((row) => (
              <Card key={row.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-bold">{row.attDate}</p>
                  <p className="text-sm text-muted">{row.inTime || "—"} · {row.outTime || "—"}</p>
                </div>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </Card>
            ))}
          </div>
          <DataTable
            columns={[
              { key: "attDate", label: "Date" },
              { key: "inTime", label: "In" },
              { key: "outTime", label: "Out" },
              { key: "status", label: "Status" },
              { key: "remarks", label: "Remarks" },
            ]}
            rows={data}
          />
        </div>
      </div>
    </div>
  );
}
