"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
    </label>
  );
}

const control =
  "w-full rounded-2xl border border-line bg-white px-3.5 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

const SEARCH_AT = 8;

type SelectOption = { value: string; label: string; disabled: boolean };

function optionText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return optionText(node.props.children);
  return "";
}

function readOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return;
    if (child.type !== "option") return;
    const label = optionText(child.props.children).replace(/\s+/g, " ").trim();
    const value = child.props.value === undefined ? label : String(child.props.value);
    options.push({ value, label: label || value, disabled: Boolean(child.props.disabled) });
  });
  return options;
}

function asValue(value: SelectHTMLAttributes<HTMLSelectElement>["value"] | SelectHTMLAttributes<HTMLSelectElement>["defaultValue"]) {
  if (Array.isArray(value)) return value[0] == null ? "" : String(value[0]);
  if (value == null) return "";
  return String(value);
}

function emitChange(onChange: SelectHTMLAttributes<HTMLSelectElement>["onChange"], next: string, name?: string) {
  onChange?.({
    target: { value: next, name: name ?? "" },
    currentTarget: { value: next, name: name ?? "" },
  } as ChangeEvent<HTMLSelectElement>);
}

function SearchableSelect({
  className,
  options,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  id,
}: {
  className?: string;
  options: SelectOption[];
  value?: SelectHTMLAttributes<HTMLSelectElement>["value"];
  defaultValue?: SelectHTMLAttributes<HTMLSelectElement>["defaultValue"];
  onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef(options);
  const [uncontrolled, setUncontrolled] = useState(() => asValue(defaultValue));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 });
  const current = value !== undefined ? asValue(value) : uncontrolled;
  const currentRef = useRef(current);
  optionsRef.current = options;
  currentRef.current = current;
  const selected = options.find((option) => option.value === current);
  const shown = selected?.label || "Select";
  const filtered = options.filter((option) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (!option.value) return false;
    return option.label.toLowerCase().includes(q);
  });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const place = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const below = spaceBelow >= 220 || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(160, Math.min(320, (below ? spaceBelow : spaceAbove) - 8));
      const width = Math.min(rect.width, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const top = below ? rect.bottom + gap : Math.max(8, rect.top - gap - maxHeight);
      setBox({ top, left, width, maxHeight });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim().toLowerCase();
    const matches = optionsRef.current.filter((option) => {
      if (!q) return true;
      if (!option.value) return false;
      return option.label.toLowerCase().includes(q);
    });
    const selectedIndex = matches.findIndex((option) => option.value === currentRef.current && !option.disabled);
    const next = q
      ? Math.max(0, matches.findIndex((option) => !option.disabled))
      : selectedIndex >= 0
        ? selectedIndex
        : 0;
    setActive(next);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(next: string) {
    if (value === undefined) setUncontrolled(next);
    emitChange(onChange, next, name);
    setInvalid(false);
    close();
    buttonRef.current?.focus();
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option && !option.disabled) choose(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      buttonRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        className={cn(
          control,
          "flex h-12 items-center justify-between gap-2 text-left",
          !current && "text-slate-400",
          invalid && "border-danger",
          className
        )}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="truncate">{shown}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      <select
        name={name}
        required={required}
        disabled={disabled}
        value={current}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          setOpen(true);
          buttonRef.current?.focus();
        }}
      >
        {!options.some((option) => option.value === "") ? <option value="" /> : null}
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[80] overflow-hidden rounded-2xl border border-line bg-white shadow-card"
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
            >
              <div className="border-b border-line p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onSearchKey}
                    placeholder="Search"
                    autoComplete="off"
                    aria-label="Search options"
                    className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-base text-ink outline-none focus:border-brand"
                  />
                </div>
              </div>
              <ul id={listId} role="listbox" className="overflow-y-auto p-1.5" style={{ maxHeight: Math.max(96, box.maxHeight - 64) }}>
                {filtered.length ? (
                  filtered.map((option, index) => (
                    <li key={`${option.value}-${index}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option.value === current}
                        data-index={index}
                        disabled={option.disabled}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink",
                          index === active && "bg-brand-soft",
                          option.value === current && "font-semibold text-brand",
                          option.disabled && "cursor-not-allowed opacity-40"
                        )}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(option.value)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
                )}
              </ul>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function Select({ className, children, value, defaultValue, onChange, name, required, disabled, id, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = readOptions(children);
  if (options.length >= SEARCH_AT) {
    return (
      <SearchableSelect
        className={className}
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        name={name}
        required={required}
        disabled={disabled}
        id={id}
      />
    );
  }

  return (
    <select
      className={cn(control, "h-12 appearance-none", className)}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      id={id}
      {...(value !== undefined ? { value } : { defaultValue })}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-3", className)} {...props} />;
}

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10",
        className
      )}
      {...props}
    />
  );
}
