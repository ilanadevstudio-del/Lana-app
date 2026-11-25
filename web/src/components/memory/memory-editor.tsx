"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { createMemory, MEMORY_CATEGORIES, updateMemory } from "@/lib/data/memory";
import type { MemoryCategory, MemoryItem } from "@/lib/data/types";

export function MemoryEditor({
  state,
  onClose,
}: {
  /** `null` closed, `{}` new, `{ item }` edit. */
  state: { item?: MemoryItem; category?: MemoryCategory } | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!state}
      onOpenChange={(o) => !o && onClose()}
      title={state?.item ? "Edit memory" : "Add a memory"}
      description="Write it the way you'd brief an assistant. LANA uses this in future requests."
    >
      {state && <Form key={state.item?.id ?? "new"} item={state.item} defaultCategory={state.category} onClose={onClose} />}
    </Dialog>
  );
}

function Form({ item, defaultCategory, onClose }: { item?: MemoryItem; defaultCategory?: MemoryCategory; onClose: () => void }) {
  const [category, setCategory] = useState<MemoryCategory>(item?.category ?? defaultCategory ?? "preferences");
  const [title, setTitle] = useState(item?.title ?? "");
  const [detail, setDetail] = useState(item?.detail ?? "");
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !title.trim() ? "Add a short summary." : undefined;

  function save() {
    setSubmitted(true);
    if (!title.trim()) return;
    if (item) {
      updateMemory(item.id, { category, title: title.trim(), detail: detail.trim() });
      toast({ title: "Memory updated", tone: "success" });
    } else {
      createMemory({ category, title: title.trim(), detail: detail.trim() });
      toast({ title: "LANA will remember this", tone: "success" });
    }
    onClose();
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-4 pb-2"
    >
      <Field label="Summary" error={error}>
        {(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prefers calls after 2 PM" />}
      </Field>
      <Field label="Details" optional>
        {(p) => <Textarea {...p} value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="Anything that helps LANA apply this correctly" />}
      </Field>
      <Field label="Category">
        {(p) => (
          <Select {...p} value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)}>
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="-mx-5 mt-1 flex justify-end gap-2 border-t border-line-subtle px-5 pt-3">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {item ? "Save changes" : "Add memory"}
        </Button>
      </div>
    </form>
  );
}
