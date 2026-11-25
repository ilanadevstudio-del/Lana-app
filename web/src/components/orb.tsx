"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { OrbState } from "@/lib/types";

export type { OrbState };

interface OrbConfig {
  /** Swirl speed in degrees per second. */
  speed: number;
  /** Breathing keyframes for scale. */
  breathe: number[];
  breatheDuration: number;
  tint?: string;
  label: string;
}

const CONFIG: Record<OrbState, OrbConfig> = {
  idle: { speed: 22, breathe: [1, 1.035, 1], breatheDuration: 5, label: "Lana is ready" },
  listening: {
    speed: 50,
    breathe: [1, 1.08, 0.98, 1.05, 1],
    breatheDuration: 1.4,
    label: "Lana is listening",
  },
  understanding: {
    speed: 90,
    breathe: [1, 1.06, 1],
    breatheDuration: 1.6,
    label: "Lana is understanding your request",
  },
  planning: { speed: 110, breathe: [1, 1.05, 1], breatheDuration: 1.3, label: "Lana is planning" },
  awaiting_approval: {
    speed: 30,
    breathe: [1, 1.04, 1],
    breatheDuration: 2.4,
    label: "Lana is waiting for your approval",
  },
  executing: { speed: 160, breathe: [1, 1.03, 1], breatheDuration: 1, label: "Lana is working" },
  completed: {
    speed: 22,
    breathe: [1, 1.035, 1],
    breatheDuration: 5,
    tint: "var(--success)",
    label: "Done",
  },
  failed: {
    speed: 18,
    breathe: [1, 1.02, 1],
    breatheDuration: 5,
    tint: "var(--danger)",
    label: "Something went wrong",
  },
  partially_completed: {
    speed: 20,
    breathe: [1, 1.03, 1],
    breatheDuration: 5,
    tint: "var(--warning)",
    label: "Partially completed",
  },
};

const IRIDESCENT =
  "conic-gradient(from 0deg, #a5b4fc, #f0abfc, #c4b5fd, #7dd3fc, #f9a8d4, #d8b4fe, #a5b4fc)";

const SWIRL =
  "radial-gradient(circle at 30% 70%, rgb(255 255 255 / 0.85), transparent 35%), radial-gradient(circle at 75% 30%, rgb(244 114 182 / 0.7), transparent 40%), radial-gradient(circle at 60% 80%, rgb(56 189 248 / 0.6), transparent 40%)";

interface OrbProps {
  size?: number;
  state?: OrbState;
  className?: string;
}

export function Orb({ size = 120, state = "idle", className }: OrbProps) {
  const cfg = CONFIG[state];
  const reduceMotion = useReducedMotion();

  // Spin is driven frame-by-frame so speed changes ease in smoothly instead of restarting.
  const angle = useMotionValue(0);
  const counterAngle = useTransform(angle, (a) => -a * 0.7);
  const targetSpeed = useRef(cfg.speed);
  const currentSpeed = useRef(cfg.speed);

  useEffect(() => {
    targetSpeed.current = cfg.speed;
  }, [cfg.speed]);

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return;
    const ease = Math.min(1, delta / 500);
    currentSpeed.current += (targetSpeed.current - currentSpeed.current) * ease;
    angle.set((angle.get() + (currentSpeed.current * delta) / 1000) % 360);
  });

  const blur = Math.max(6, size / 9);

  return (
    <div
      role="img"
      aria-label={cfg.label}
      className={`relative shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <motion.div
        aria-hidden
        className="absolute -inset-[22%] rounded-full opacity-55 dark:opacity-75"
        style={{ background: IRIDESCENT, rotate: angle, filter: `blur(${blur * 1.6}px)` }}
      />

      {/* Sphere */}
      <motion.div
        className="relative size-full overflow-hidden rounded-full"
        animate={reduceMotion ? undefined : { scale: cfg.breathe }}
        transition={{ duration: cfg.breatheDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden
          className="absolute -inset-[35%]"
          style={{ background: IRIDESCENT, rotate: angle, filter: `blur(${blur}px)` }}
        />
        <motion.div
          aria-hidden
          className="absolute -inset-[20%] mix-blend-soft-light"
          style={{ background: SWIRL, rotate: counterAngle, filter: `blur(${blur * 0.6}px)` }}
        />

        {/* Outcome tint */}
        <motion.div
          aria-hidden
          className="absolute inset-0 mix-blend-color"
          style={{ background: cfg.tint ?? "transparent" }}
          initial={false}
          animate={{ opacity: cfg.tint ? 0.55 : 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Glass shading + specular highlight */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "inset -10px -14px 30px rgb(88 56 180 / 0.35), inset 8px 10px 24px rgb(255 255 255 / 0.55)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 24%, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0) 36%)",
          }}
        />
      </motion.div>
    </div>
  );
}
