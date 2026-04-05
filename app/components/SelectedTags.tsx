"use client";

import { motion } from "framer-motion";

type SelectedTagsProps = {
  tags: string[];
  onRemove?: (tag: string) => void;
};

export function SelectedTags({ tags, onRemove }: SelectedTagsProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-slate-500">Selected symptoms will appear here.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <motion.span
          layout
          key={tag}
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.92 }}
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900"
        >
          {tag}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="rounded-full text-sky-700 transition hover:text-sky-900"
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          ) : null}
        </motion.span>
      ))}
    </div>
  );
}