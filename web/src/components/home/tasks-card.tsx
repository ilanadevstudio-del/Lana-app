"use client";

import { useState } from "react";
import { CheckCircleIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { EmptyState, SectionCard } from "@/components/section-card";
import type { Priority, TaskItem } from "@/lib/types";

const PRIORITY: Record<Priority, { color: string; label: string }> = {
  high: { color: "var(--danger)", label: "High priority" },
  medium: { color: "var(--warning)", label: "Medium priority" },
  low: { color: "var(--subtle)", label: "Low priority" },
};

export function TasksCard({ items, delay }: { items: TaskItem[]; delay?: number }) {
  const [tasks, setTasks] = useState(items);
  const open = tasks.filter((t) => !t.done).length;

  const toggle = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <SectionCard
      title="Today's tasks"
      icon={<CheckCircleIcon size={18} weight="duotone" />}
      href="/tasks"
      count={open}
      delay={delay}
    >
      {tasks.length === 0 ? (
        <EmptyState>Nothing due today. Enjoy it.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                aria-pressed={task.done}
                className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-glass"
              >
                <Checkbox checked={task.done} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-medium transition-colors duration-300 ${
                      task.done ? "text-subtle line-through decoration-subtle/60" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <span
                      title={PRIORITY[task.priority].label}
                      className="size-1.5 rounded-full"
                      style={{ background: PRIORITY[task.priority].color }}
                    />
                    {[task.category, task.due].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`relative grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300 ${
        checked ? "border-transparent" : "border-subtle/60 group-hover:border-accent"
      }`}
    >
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span
            className="bg-brand absolute inset-[-2px] grid place-items-center rounded-full text-white"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <CheckIcon size={13} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
