"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, TextArea, TextInput } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest, errorMessage } from "@/lib/api/client";
import type { StoredProject } from "@/types/project";

interface ProjectManagerProps {
  initialProjects: StoredProject[];
  uploadsEnabled: boolean;
}

type Mode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; project: StoredProject };

export function ProjectManager({ initialProjects, uploadsEnabled }: ProjectManagerProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function reload() {
    const result = await apiRequest<{ projects: StoredProject[] }>("/api/admin/projects");
    setProjects(result.projects);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      title: String(form.get("title") ?? ""),
      category: String(form.get("category") ?? ""),
      description: String(form.get("description") ?? ""),
      technologies: String(form.get("technologies") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      image: String(form.get("image") ?? ""),
      githubUrl: String(form.get("githubUrl") ?? ""),
      liveUrl: String(form.get("liveUrl") ?? ""),
      featured: form.get("featured") === "on",
      isPublished: form.get("isPublished") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    setPending(true);
    setError(null);

    try {
      if (mode.kind === "edit") {
        await apiRequest(`/api/admin/projects/${mode.project.id}`, {
          method: "PATCH",
          json: payload,
        });
        setNotice("Project updated.");
      } else {
        await apiRequest("/api/admin/projects", { json: payload });
        setNotice("Project created.");
      }
      await reload();
      setMode({ kind: "closed" });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function togglePublish(project: StoredProject) {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        json: { isPublished: !project.isPublished },
      });
      setNotice(project.isPublished ? "Project unpublished." : "Project published.");
      await reload();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function remove(project: StoredProject) {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      setNotice("Project deleted.");
      await reload();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setConfirmId(null);
      setPending(false);
    }
  }

  const editing = mode.kind === "edit" ? mode.project : undefined;

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {uploadsEnabled ? null : (
        <Alert tone="warning">
          S3 is not configured, so image uploads are unavailable. Reference an
          in-repo asset path such as <code>/images/projects/name.svg</code> instead.
        </Alert>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setMode({ kind: "create" })}>
          New project
        </Button>
      </div>

      {mode.kind !== "closed" ? (
        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">
            {editing ? `Edit ${editing.title}` : "New project"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2" noValidate>
            <Field id="prj-title" label="Title">
              <TextInput id="prj-title" name="title" defaultValue={editing?.title} required />
            </Field>

            <Field id="prj-category" label="Category">
              <TextInput
                id="prj-category"
                name="category"
                defaultValue={editing?.category}
                required
              />
            </Field>

            <div className="md:col-span-2">
              <Field id="prj-description" label="Description">
                <TextArea
                  id="prj-description"
                  name="description"
                  rows={3}
                  defaultValue={editing?.description}
                  required
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field id="prj-tech" label="Technologies" hint="Comma separated">
                <TextInput
                  id="prj-tech"
                  name="technologies"
                  defaultValue={editing?.technologies.join(", ")}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field id="prj-image" label="Image path" hint="Path or key for the preview image">
                <TextInput id="prj-image" name="image" defaultValue={editing?.image ?? ""} />
              </Field>
            </div>

            <Field
              id="prj-github"
              label="Repository URL"
              hint="Leave empty unless a real public repository exists"
            >
              <TextInput
                id="prj-github"
                name="githubUrl"
                type="url"
                defaultValue={editing?.githubUrl ?? ""}
              />
            </Field>

            <Field
              id="prj-live"
              label="Live demo URL"
              hint="Leave empty unless a real deployment exists"
            >
              <TextInput
                id="prj-live"
                name="liveUrl"
                type="url"
                defaultValue={editing?.liveUrl ?? ""}
              />
            </Field>

            <Field id="prj-order" label="Sort order">
              <TextInput
                id="prj-order"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={editing?.sortOrder ?? 0}
              />
            </Field>

            <div className="flex items-center gap-5">
              <Checkbox
                id="prj-published"
                name="isPublished"
                label="Published"
                defaultChecked={editing?.isPublished ?? false}
              />
              <Checkbox
                id="prj-featured"
                name="featured"
                label="Featured"
                defaultChecked={editing?.featured ?? false}
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Create project"}
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

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project and publish it to show it in the public portfolio."
        />
      ) : (
        <DataTable caption="Projects" headers={["Title", "Category", "State", "Order", ""]}>
          {projects.map((project) => (
            <tr key={project.id}>
              <td className="px-4 py-3">
                <span className="block font-medium text-foreground">{project.title}</span>
                <span className="block text-xs text-muted">{project.slug}</span>
              </td>
              <td className="px-4 py-3 text-muted">{project.category}</td>
              <td className="px-4 py-3">
                <StatusBadge status={project.isPublished ? "active" : "disabled"} />
              </td>
              <td className="px-4 py-3 text-muted">{project.sortOrder}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm text-accent hover:text-foreground"
                    onClick={() => togglePublish(project)}
                    disabled={pending}
                  >
                    {project.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-accent hover:text-foreground"
                    onClick={() => setMode({ kind: "edit", project })}
                  >
                    Edit
                  </button>
                  {confirmId === project.id ? (
                    <>
                      <button
                        type="button"
                        className="text-sm text-red-300 hover:text-red-200"
                        onClick={() => remove(project)}
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
                      onClick={() => setConfirmId(project.id)}
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
