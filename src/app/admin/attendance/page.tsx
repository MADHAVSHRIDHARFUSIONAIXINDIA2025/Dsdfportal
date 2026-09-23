"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, Select } from "@/components/ui/Field";
import { RecordCard } from "@/components/ui/RecordCard";
import { Sheet } from "@/components/ui/Sheet";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import { patch, post } from "@/lib/client";
import { useState } from "react";

type Row = { id: string; engineerId: string; engineer: string; attDate: string; inTime: string; outTime: string; status: string; remarks: string };
type Engineer = { id: string; name: string };

const empty = { engineerId: "", attDate: "", inTime: "", outTime: "", status: "Present", remarks: "" };

export default function AttendancePage() {
  const { data = [], loading, reload, remove } = useResource<Row[]>("/api/attendance");
  const engineers = useResource<Engineer[]>("/api/engineers");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const toast = useToast();

  function edit(row?: Row) {
    setId(row?.id || "");
    setForm(row ? { ...empty, ...row } : empty);
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (id) await patch(`/api/attendance/${id}`, form);
      else await post("/api/attendance", form);
      toast.push("Attendance saved");
      setOpen(false);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Attendance" subtitle="One record per engineer per day. Saving the same date updates it." action={{ label: "Mark attendance", onClick: () => edit() }} />
      {loading ? (
        <>
          <div className="md:hidden">
            <CardSkeleton count={5} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={5} columns={5} />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {data.map((row) => (
              <RecordCard key={row.id} title={row.engineer} meta={[row.attDate, `${row.inTime || "—"} to ${row.outTime || "—"}`]} badges={[row.status]} onEdit={() => edit(row)} onDelete={() => remove(row.id)} />
            ))}
          </div>
          <DataTable
            columns={[
              { key: "attDate", label: "Date" },
              { key: "engineer", label: "Engineer" },
              { key: "inTime", label: "In" },
              { key: "outTime", label: "Out" },
              { key: "status", label: "Status" },
            ]}
            rows={data}
            onEdit={(rowId) => edit(data.find((row) => row.id === rowId))}
            onDelete={remove}
          />
        </>
      )}
      <Sheet open={open} title="Attendance" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          <Field label="Engineer *">
            <Select value={form.engineerId} onChange={(e) => setForm({ ...form, engineerId: e.target.value })} required>
              <option value="">Select engineer</option>
              {(engineers.data || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
          </Field>
          <Field label="Date *"><Input type="date" value={form.attDate} onChange={(e) => setForm({ ...form, attDate: e.target.value })} required /></Field>
          <Field label="In time"><Input type="time" value={form.inTime} onChange={(e) => setForm({ ...form, inTime: e.target.value })} /></Field>
          <Field label="Out time"><Input type="time" value={form.outTime} onChange={(e) => setForm({ ...form, outTime: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{ATTENDANCE_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Remarks"><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <Button type="submit" className="w-full">Save attendance</Button>
        </form>
      </Sheet>
    </div>
  );
}
