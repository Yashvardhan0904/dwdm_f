"use client";

import Fuse from "fuse.js";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type SymptomAutocompleteProps = {
  symptoms: readonly string[];
  selectedSymptoms: string[];
  onSelectSymptom: (symptom: string) => void;
};

type SymptomItem = {
  label: string;
};

type MatchIndex = [number, number];

const SUGGESTION_LIMIT = 6;

function highlightText(text: string, indices: readonly [number, number][]) {
  if (indices.length === 0) {
    return text;
  }

  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  const chunks: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;

  for (const [start, end] of sorted) {
    if (start > cursor) {
      chunks.push({ text: text.slice(cursor, start), highlight: false });
    }
    chunks.push({ text: text.slice(start, end + 1), highlight: true });
    cursor = end + 1;
  }

  if (cursor < text.length) {
    chunks.push({ text: text.slice(cursor), highlight: false });
  }

  return chunks.map((chunk, index) =>
    chunk.highlight ? (
      <mark key={`${chunk.text}-${index}`} className="bg-sky-200/70 px-0.5 text-sky-950">
        {chunk.text}
      </mark>
    ) : (
      <span key={`${chunk.text}-${index}`}>{chunk.text}</span>
    ),
  );
}

export function SymptomAutocomplete({
  symptoms,
  selectedSymptoms,
  onSelectSymptom,
}: SymptomAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const items: SymptomItem[] = useMemo(
    () => symptoms.map((label) => ({ label })),
    [symptoms],
  );

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["label"],
        threshold: 0.36,
        ignoreLocation: true,
        includeMatches: true,
        minMatchCharLength: 1,
      }),
    [items],
  );

  const suggestions = useMemo(() => {
    if (!debouncedQuery) {
      return [];
    }

    return fuse
      .search(debouncedQuery)
      .filter((item) => !selectedSymptoms.includes(item.item.label))
      .slice(0, SUGGESTION_LIMIT)
      .map((result) => {
        const labelMatch = result.matches?.find((match) => match.key === "label");

        return {
          label: result.item.label,
          matchIndices: (labelMatch?.indices as readonly MatchIndex[] | undefined) ?? [],
        };
      });
  }, [debouncedQuery, fuse, selectedSymptoms]);

  const clampedActiveIndex = Math.min(
    activeIndex,
    Math.max(0, suggestions.length - 1),
  );

  const noResults = debouncedQuery.length > 0 && suggestions.length === 0;
  const showDropdown = isOpen && (debouncedQuery.length > 0 || noResults);

  const handleSelect = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      return;
    }

    onSelectSymptom(symptom);
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (!showDropdown) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            const picked = suggestions[clampedActiveIndex];

            if (picked) {
              handleSelect(picked.label);
            }
          }
        }}
        placeholder="Search symptoms, e.g. headache, fever"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />

      <AnimatePresence>
        {showDropdown ? (
          <motion.ul
            key="symptom-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {noResults ? (
              <li className="px-4 py-3 text-sm text-slate-500">No results found.</li>
            ) : (
              suggestions.map((suggestion, index) => (
                <li key={suggestion.label}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelect(suggestion.label);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition ${
                      index === clampedActiveIndex
                        ? "bg-sky-50 text-sky-900"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {highlightText(suggestion.label, suggestion.matchIndices)}
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}