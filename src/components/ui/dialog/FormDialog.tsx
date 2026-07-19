"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "./Dialog";
import { Button } from "../button/Button";

interface FormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  children,
  loading,
  disabled,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-96">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
              size="md"
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={disabled}
              size="md"
            >
              {loading ? "Loading..." : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
