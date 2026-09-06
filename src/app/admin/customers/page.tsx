"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/Field";
import { RecordCard } from "@/components/ui/RecordCard";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { CUSTOMER_CATEGORIES, FIBER_CORES, LINK_TYPES, MANAGE_BY, PATH_NAMES } from "@/lib/constants";
import { patch, post } from "@/lib/client";
import { useMemo, useState } from "react";

type Company = { id: string; name: string; contact: string; email: string; address: string; status: string };
type Customer = {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyContact: string;
  companyEmail: string;
  companyAddress: string;
  linkId: string;
  city: string;
  linkType: string;
  pathName: string;
  fiberCore: string;
  customerCategory: string;
  manageBy: string;
  vendorName: string;
  vendorContact: string;
  serviceType: string;
  bandwidth: string;
  aEnd: string;
  bEnd: string;
  aEndLatitude: string;
  aEndLongitude: string;
  bEndLatitude: string;
  bEndLongitude: string;
  implementationDate: string;
  contact: string;
  slaHours: number;
  status: string;
  remarks: string;
};

const empty: Omit<Customer, "id" | "companyName"> = {
  name: "",
  companyId: "",
  companyContact: "",
  companyEmail: "",
  companyAddress: "",
  linkId: "",
  city: "",
  linkType: "Linear",
  pathName: "Main Path",
  fiberCore: "Single Core",
  customerCategory: "Enterprise",
  manageBy: "Manage By Own",
  vendorName: "",
  vendorContact: "",
  serviceType: "",
  bandwidth: "",
  aEnd: "",
  bEnd: "",
  aEndLatitude: "",
  aEndLongitude: "",
  bEndLatitude: "",
  bEndLongitude: "",
  implementationDate: "",
  contact: "",
  slaHours: 4,
  status: "Active",
  remarks: "",
};

export default function CustomersPage() {
  const { data = [], reload, remove } = useResource<Customer[]>("/api/customers");
  const companies = useResource<Company[]>("/api/companies");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const toast = useToast();

  const cities = useMemo(() => [...new Set(data.map((row) => row.city).filter(Boolean))].sort(), [data]);
  const filtered = data.filter((row) => {
    const hay = Object.values(row).join(" ").toLowerCase();
    return (!city || row.city === city) && hay.includes(q.toLowerCase());
  });

  function fillCompany(companyId: string) {
    const company = companies.data?.find((row) => row.id === companyId);
    setForm((current) => ({
      ...current,
      companyId,
      companyContact: company?.contact || "",
      companyEmail: company?.email || "",
      companyAddress: company?.address || "",
    }));
  }

  function edit(row?: Customer) {
    setId(row?.id || "");
    setForm(row ? { ...empty, ...row } : empty);
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (id) await patch(`/api/customers/${id}`, form);
      else await post("/api/customers", form);
      toast.push("Customer / link saved");
      setOpen(false);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  const vi = (companies.data?.find((row) => row.id === form.companyId)?.name || "").toLowerCase() === "vodafone idea limited";

  return (
    <div>
      <PageIntro title="Customers & links" subtitle="Path-wise fiber circuits with A/B ends, SLA and vendor control." action={{ label: "Add link", onClick: () => edit() }} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px]">
        <SearchInput placeholder="Search customer, company, city, link..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-3 md:hidden">
        {filtered.map((row) => (
          <RecordCard
            key={row.id}
            title={row.name}
            meta={[row.companyName, row.linkId, `${row.city} · ${row.linkType} · ${row.pathName}`]}
            badges={[row.status, row.customerCategory]}
            onEdit={() => edit(row)}
            onDelete={() => remove(row.id)}
          />
        ))}
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Customer" },
          { key: "companyName", label: "Company" },
          { key: "linkId", label: "Link ID" },
          { key: "city", label: "City" },
          { key: "linkType", label: "Type" },
          { key: "pathName", label: "Path" },
          { key: "status", label: "Status" },
        ]}
        rows={filtered}
        onEdit={(rowId) => edit(data.find((row) => row.id === rowId))}
        onDelete={remove}
      />
      <Sheet open={open} title={id ? "Update link" : "New customer / link"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Customer *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Company *">
            <Select value={form.companyId} onChange={(e) => fillCompany(e.target.value)} required>
              <option value="">Select registered company</option>
              {(companies.data || []).map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Link ID">{vi ? <Input value={form.linkId} onChange={(e) => setForm({ ...form, linkId: e.target.value })} required placeholder="Vodafone circuit ID" /> : <Input value={form.linkId} readOnly placeholder="Auto-generated path-wise" />}</Field>
          <Field label="City *"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></Field>
          <Field label="Link type">
            <Select value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value, pathName: e.target.value === "Linear" ? "Main Path" : form.pathName })}>
              {LINK_TYPES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Path">
            <Select value={form.pathName} onChange={(e) => setForm({ ...form, pathName: e.target.value })} disabled={form.linkType === "Linear"}>
              {PATH_NAMES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Fiber core"><Select value={form.fiberCore} onChange={(e) => setForm({ ...form, fiberCore: e.target.value })}>{FIBER_CORES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Customer type"><Select value={form.customerCategory} onChange={(e) => setForm({ ...form, customerCategory: e.target.value })}>{CUSTOMER_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Manage by"><Select value={form.manageBy} onChange={(e) => setForm({ ...form, manageBy: e.target.value })}>{MANAGE_BY.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          {form.manageBy === "Vendor" ? (
            <>
              <Field label="Vendor name *"><Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} required /></Field>
              <Field label="Vendor contact"><Input value={form.vendorContact} onChange={(e) => setForm({ ...form, vendorContact: e.target.value })} /></Field>
            </>
          ) : null}
          <Field label="Company contact"><Input value={form.companyContact} readOnly /></Field>
          <Field label="Company email"><Input value={form.companyEmail} readOnly /></Field>
          <Field className="md:col-span-2" label="Company address"><Input value={form.companyAddress} readOnly /></Field>
          <Field label="Service type"><Input value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} /></Field>
          <Field label="Bandwidth"><Input value={form.bandwidth} onChange={(e) => setForm({ ...form, bandwidth: e.target.value })} /></Field>
          <Field label="A-End"><Input value={form.aEnd} onChange={(e) => setForm({ ...form, aEnd: e.target.value })} /></Field>
          <Field label="B-End"><Input value={form.bEnd} onChange={(e) => setForm({ ...form, bEnd: e.target.value })} /></Field>
          <Field label="A-End lat"><Input value={form.aEndLatitude} onChange={(e) => setForm({ ...form, aEndLatitude: e.target.value })} /></Field>
          <Field label="A-End long"><Input value={form.aEndLongitude} onChange={(e) => setForm({ ...form, aEndLongitude: e.target.value })} /></Field>
          <Field label="B-End lat"><Input value={form.bEndLatitude} onChange={(e) => setForm({ ...form, bEndLatitude: e.target.value })} /></Field>
          <Field label="B-End long"><Input value={form.bEndLongitude} onChange={(e) => setForm({ ...form, bEndLongitude: e.target.value })} /></Field>
          <Field label="Implementation date"><Input type="date" value={form.implementationDate} onChange={(e) => setForm({ ...form, implementationDate: e.target.value })} /></Field>
          <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          <Field label="SLA hours"><Input type="number" step="0.1" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></Select></Field>
          <Field className="md:col-span-2" label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <Button type="submit" className="md:col-span-2 w-full">Save customer / link</Button>
        </form>
      </Sheet>
    </div>
  );
}
