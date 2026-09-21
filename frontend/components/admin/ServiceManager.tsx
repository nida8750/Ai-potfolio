"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest, errorMessage } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { StoredService } from "@/types/service";

interface ServiceManagerProps {
  initialServices: StoredService[];
  currencies: string[];
}

type Mode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; service: StoredService };

export function ServiceManager({ initialServices, currencies }: ServiceManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function reload() {
    const result = await apiRequest<{ services: StoredService[] }>("/api/admin/services");
    setServices(result.services);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pricingType = String(form.get("pricingType")) as StoredService["pricingType"];
    const rawPrice = String(form.get("price") ?? "").trim();

    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      shortDescription: String(form.get("shortDescription") ?? "") || undefined,
      technologies: String(form.get("technologies") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      pricingType,
      price: pricingType === "custom" ? null : rawPrice ? Number(rawPrice) : null,
      currency: String(form.get("currency") ?? currencies[0]),
      icon: String(form.get("icon") ?? "agents"),
      isActive: form.get("isActive") === "on",
      featured: form.get("featured") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    setPending(true);
    setError(null);

    try {
      if (mode.kind === "edit") {
        await apiRequest(`/api/admin/services/${mode.service.id}`, {
          method: "PATCH",
          json: payload,
        });
        setNotice("Service updated.");
      } else {
        await apiRequest("/api/admin/services", { json: payload });
        setNotice("Service created.");
      }
      await reload();
      setMode({ kind: "closed" });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function remove(service: StoredService) {
    setPending(true);
    setError(null);

    try {
      const result = await apiRequest<{ deleted: boolean; deactivated: boolean }>(
        `/api/admin/services/${service.id}`,
        { method: "DELETE" },
      );
      setNotice(
        result.deactivated
          ? "Service has orders, so it was deactivated instead of deleted."
          : "Service deleted.",
      );
      await reload();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setConfirmId(null);
      setPending(false);
    }
  }

  const editing = mode.kind === "edit" ? mode.service : undefined;

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setMode({ kind: "create" })}>
          New service
        </Button>
      </div>

      {mode.kind !== "closed" ? (
        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">
            {editing ? `Edit ${editing.title}` : "New service"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2" noValidate>
            <Field id="svc-title" label="Title">
              <TextInput id="svc-title" name="title" defaultValue={editing?.title} required />
            </Field>

            <Field id="svc-short" label="Short description" hint="Optional summary">
              <TextInput
                id="svc-short"
                name="shortDescription"
                defaultValue={editing?.shortDescription}
              />
            </Field>

            <div className="md:col-span-2">
              <Field id="svc-description" label="Description">
                <TextArea
                  id="svc-description"
                  name="description"
                  rows={3}
                  defaultValue={editing?.description}
                  required
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                id="svc-tech"
                label="Technologies"
                hint="Comma separated, up to 12"
              >
                <TextInput
                  id="svc-tech"
                  name="technologies"
                  defaultValue={editing?.technologies.join(", ")}
                />
              </Field>
            </div>

            <Field id="svc-pricing" label="Pricing type">
              <SelectInput
                id="svc-pricing"
                name="pricingType"
                defaultValue={editing?.pricingType ?? "custom"}
              >
                <option value="custom">Custom quote</option>
                <option value="fixed">Fixed price</option>
                <option value="starting_from">Starting from</option>
              </SelectInput>
            </Field>

            <Field
              id="svc-price"
              label="Price"
              hint="Leave empty for custom quote services"
            >
              <TextInput
                id="svc-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editing?.price ?? ""}
              />
            </Field>

            <Field id="svc-currency" label="Currency">
              <SelectInput
                id="svc-currency"
                name="currency"
                defaultValue={editing?.currency ?? currencies[0]}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field id="svc-icon" label="Icon">
              <SelectInput id="svc-icon" name="icon" defaultValue={editing?.icon ?? "agents"}>
                <option value="agents">Agents</option>
                <option value="rag">RAG</option>
                <option value="automation">Automation</option>
                <option value="voice">Voice</option>
              </SelectInput>
            </Field>

            <Field id="svc-order" label="Sort order">
              <TextInput
                id="svc-order"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={editing?.sortOrder ?? 0}
              />
            </Field>

            <div className="flex items-center gap-5 md:col-span-2">
              <Checkbox
                id="svc-active"
                name="isActive"
                label="Active"
                defaultChecked={editing ? editing.isActive : true}
              />
              <Checkbox
                id="svc-featured"
                name="featured"
                label="Featured"
                defaultChecked={editing?.featured ?? false}
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Create service"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMode({ kind: "closed" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      ) : null}

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Create the first service to populate the public services section."
        />
      ) : (
        <DataTable
          caption="Services"
          headers={["Title", "Pricing", "State", "Order", ""]}
        >
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-4 py-3">
                <span className="block font-medium text-foreground">{service.title}</span>
                <span className="block text-xs text-muted">{service.slug}</span>
              </td>
              <td className="px-4 py-3 text-muted">
                {service.pricingType === "custom"
                  ? "Custom quote"
                  : `${formatMoney(service.price ?? 0, service.currency)}${
                      service.pricingType === "starting_from" ? "+" : ""
                    }`}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={service.isActive ? "active" : "disabled"} />
              </td>
              <td className="px-4 py-3 text-muted">{service.sortOrder}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm text-accent hover:text-foreground"
                    onClick={() => setMode({ kind: "edit", service })}
                  >
                    Edit
                  </button>
                  {confirmId === service.id ? (
                    <>
                      <button
                        type="button"
                        className="text-sm text-red-300 hover:text-red-200"
                        onClick={() => remove(service)}
                        disabled={pending}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="text-sm text-muted hover:text-foreground"
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-red-300"
                      onClick={() => setConfirmId(service.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
