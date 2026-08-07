"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "./modal";

/** Required confirmation step for any admin action that materially affects other users
 *  (disqualify, round start/pause/resume/end, leaderboard visibility change, deletes, ...).
 *  `children` can hold extra inputs the confirmation needs, e.g. a disqualification reason. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClassName="max-w-md">
      {description && <p className="mb-4 text-sm text-slate-600">{description}</p>}
      {children}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? "destructive" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
