"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { announcementInputSchema } from "@tech-survivor/shared";
import type { Announcement, AnnouncementAudience, AnnouncementPriority } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { isoToLocalInput, localInputToIso } from "@/lib/datetimeLocal";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Modal } from "@/components/admin/modal";

const PRIORITY_BADGE: Record<AnnouncementPriority, BadgeProps["variant"]> = {
  info: "info",
  warning: "warning",
  urgent: "destructive",
};

/** Same reasoning as the event-settings form: `.datetime()` rejects the raw
 *  "YYYY-MM-DDTHH:mm" a datetime-local input produces, so this form validates those two
 *  fields as plain strings and converts to real ISO right before re-validating against the
 *  actual `announcementInputSchema` in the mutation. */
const announcementFormSchema = z.object({
  title: z.string().trim().min(2).max(200),
  message: z.string().trim().min(1).max(5000),
  priority: z.enum(["info", "warning", "urgent"]),
  audience: z.enum(["all", "participants", "admins", "qualified"]),
  publishAt: z.string(),
  expiresAt: z.string(),
  active: z.boolean(),
});
type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

const EMPTY_FORM: AnnouncementFormValues = {
  title: "",
  message: "",
  priority: "info",
  audience: "all",
  publishAt: "",
  expiresAt: "",
  active: true,
};

function toFormValues(a: Announcement): AnnouncementFormValues {
  return {
    title: a.title,
    message: a.message,
    priority: a.priority,
    audience: a.audience,
    publishAt: isoToLocalInput(a.publishAt),
    expiresAt: isoToLocalInput(a.expiresAt),
    active: a.active,
  };
}

function useAnnouncementsAdmin() {
  return useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => apiClient.get<Announcement[]>("/admin/announcements"),
  });
}

function AnnouncementForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Announcement | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: initial ? toFormValues(initial) : EMPTY_FORM,
  });

  const mutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) => {
      const payload = announcementInputSchema.parse({
        title: values.title,
        message: values.message,
        priority: values.priority,
        audience: values.audience,
        publishAt: values.publishAt ? localInputToIso(values.publishAt) : undefined,
        expiresAt: values.expiresAt ? localInputToIso(values.expiresAt) : null,
        active: values.active,
      });
      return initial
        ? apiClient.patch<Announcement>(`/admin/announcements/${initial.id}`, payload)
        : apiClient.post<Announcement>("/admin/announcements", payload);
    },
    onSuccess: () => {
      toast.success(initial ? "Announcement updated" : "Announcement created");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      onSaved();
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not save announcement"),
  });

  return (
    <Modal open onClose={onCancel} title={initial ? "Edit Announcement" : "New Announcement"} widthClassName="max-w-xl">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={4} {...register("message")} />
          {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audience">Audience</Label>
            <Select id="audience" {...register("audience")}>
              <option value="all">All</option>
              <option value="participants">Participants</option>
              <option value="admins">Admins</option>
              <option value="qualified">Qualified (Round 2)</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publishAt">Publish at (blank = now)</Label>
            <Input id="publishAt" type="datetime-local" {...register("publishAt")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expiresAt">Expires at (blank = never)</Label>
            <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            {...register("active")}
          />
          <Label htmlFor="active" className="cursor-pointer">Active</Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initial ? "Save changes" : "Create announcement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AnnouncementsPage() {
  const query = useAnnouncementsAdmin();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<"closed" | "create" | Announcement>("closed");
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete<null>(`/admin/announcements/${id}`),
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not delete announcement"),
    onSettled: () => setDeleteTarget(null),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Announcements</h1>
          <p className="text-sm text-slate-500">Broadcast messages to participants or admins.</p>
        </div>
        <Button variant="primary" onClick={() => setFormState("create")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New Announcement
        </Button>
      </div>

      {query.isError && <Alert variant="error">Could not load announcements.</Alert>}
      {query.isLoading && <Skeleton className="h-72 w-full" />}

      {query.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Title</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Audience</th>
                  <th scope="col" className="px-4 py-3">Publish</th>
                  <th scope="col" className="px-4 py-3">Expires</th>
                  <th scope="col" className="px-4 py-3">Active</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No announcements yet.</td></tr>
                )}
                {query.data.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-navy-900">{a.title}</td>
                    <td className="px-4 py-3"><Badge variant={PRIORITY_BADGE[a.priority]}>{a.priority}</Badge></td>
                    <td className="px-4 py-3 capitalize text-slate-600">{a.audience}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(a.publishAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "Never"}</td>
                    <td className="px-4 py-3"><Badge variant={a.active ? "success" : "secondary"}>{a.active ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setFormState(a)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {formState !== "closed" && (
        <AnnouncementForm
          initial={formState === "create" ? null : formState}
          onCancel={() => setFormState("closed")}
          onSaved={() => setFormState("closed")}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this announcement?"
          description="Participants and admins will no longer see it. This cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
