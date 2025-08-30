"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * A reusable Section Header
 * @param {string} title - main title
 * @param {string} subtitle - optional subtitle/description
 * @param {string} align - "left" | "center" (default center)
 */
export default function SectionHeader({ title, subtitle, align = "center" }) {
    const alignClass =
        align === "left" ? "items-start text-left" : "items-center text-center";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col gap-2 ${alignClass} mb-8`}
        >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                {title}
            </h2>
            {subtitle && (
                <p className="text-slate-500 max-w-2xl">{subtitle}</p>
            )}
            <div className="w-16 h-1 bg-indigo-600 rounded mt-2" />
        </motion.div>
    );
}
