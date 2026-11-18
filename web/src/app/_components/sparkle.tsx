"use client";

import { SparkleIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";

export function Sparkle() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ rotate: 90, scale: 1.1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <SparkleIcon size={40} weight="duotone" />
    </motion.div>
  );
}
