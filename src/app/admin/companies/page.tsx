"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { RecordCard } from "@/components/ui/RecordCard";
import { Sheet } from "@/components/ui/Sheet";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { patch, post } from "@/lib/client";
import { useState } from "react";

type Company = {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  status: string;
  remarks: string;
};

const empty = { name: "", contact: "", email: "", address: "", status: "Active", remarks: "" };

export default function CompaniesPage() {
  const { data = [], loading, reload, remove } = useResource<Company[]>("/api/companies");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const toast = useToast();

  function edit(row?: Company) {
    setId(row?.id || "");
    setForm(row ? { ...row } : empty);
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (id) await patch(`/api/companies/${id}`, form);
      else await post("/api/companies", form);
      toast.push("Company saved");
      setOpen(false);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Company master" subtitle="Register each customer company once." action={{ label: "Add company", onClick: () => edit() }} />
      
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
              <RecordCard
                key={row.id}
                title={row.name}
                meta={[row.contact, row.email, row.address]}
                badges={[row.status]}
                onEdit={() => edit(row)}
                onDelete={() => remove(row.id)}
              />
            ))}
          </div>
          <DataTable
            columns={[
              { key: "name", label: "Company" },
              { key: "contact", label: "Contact" },
              { key: "email", label: "Email" },
              { key: "address", label: "Address" },
              { key: "status", label: "Status" },
            ]}
            rows={data}
            onEdit={(rowId) => edit(data.find((row) => row.id === rowId))}
            onDelete={remove}
          />
        </>
      )}
      <Sheet open={open} title={id ? "Update company" : "Register company"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          <Field label="Company name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </Field>
          <Field label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <Button type="submit" className="w-full">Save company</Button>
        </form>
      </Sheet>
    </div>
  );
}
