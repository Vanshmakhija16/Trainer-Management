"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type ComboboxProps = {
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  /** When true, a non-matching typed value is accepted as a new entry. */
  allowCustom?: boolean;
  /** Caps how many options are rendered at once for large datasets. */
  maxResults?: number;
  id?: string;
};

/**
 * Searchable single-select combobox that works inside native <form action>.
 * The chosen value is mirrored into a hidden input named `name` so server
 * actions / route handlers read it like any other field. Supports keyboard
 * navigation, click-outside dismissal, and (optionally) free-text entries.
 */
export function Combobox({
  name,
  options,
  defaultValue = "",
  placeholder = "Select or type…",
  required = false,
  allowCustom = true,
  maxResults = 100,
  id,
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { filtered, truncated } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter((option) => option.toLowerCase().includes(q))
      : options;
    return {
      filtered: matches.slice(0, maxResults),
      truncated: matches.length > maxResults,
    };
  }, [options, query, maxResults]);

  const exactMatch = options.some(
    (option) => option.toLowerCase() === query.trim().toLowerCase(),
  );
  const showCustom = allowCustom && query.trim().length > 0 && !exactMatch;

  // Close when clicking outside.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const optionCount = filtered.length + (showCustom ? 1 : 0);

  function commit(next: string) {
    setValue(next);
    setQuery(next);
    setOpen(false);
  }

  function openMenu() {
    setOpen(true);
    setActiveIndex(0);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return openMenu();
      setActiveIndex((index) => Math.min(index + 1, optionCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && optionCount > 0) {
        event.preventDefault();
        if (showCustom && activeIndex === filtered.length) {
          commit(query.trim());
        } else {
          commit(filtered[activeIndex]);
        }
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Mirrors the selected value for native form submission. */}
      <input type="hidden" name={name} value={value} required={required} />

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            if (allowCustom) setValue(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={openMenu}
          onKeyDown={onKeyDown}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-9 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close options" : "Open options"}
          onClick={() => (open ? setOpen(false) : openMenu())}
          className="absolute inset-y-0 right-0 grid w-9 place-items-center text-zinc-400 transition hover:text-zinc-600"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg"
        >
          {filtered.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option === value;
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(option);
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                  isActive ? "bg-teal-50 text-teal-900" : "text-zinc-700"
                }`}
              >
                <span>{option}</span>
                {isSelected ? (
                  <span className="text-teal-600">✓</span>
                ) : null}
              </li>
            );
          })}

          {showCustom ? (
            <li
              role="option"
              aria-selected={false}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              onMouseDown={(event) => {
                event.preventDefault();
                commit(query.trim());
              }}
              className={`flex cursor-pointer items-center gap-2 border-t border-zinc-100 px-3 py-2 ${
                activeIndex === filtered.length
                  ? "bg-teal-50 text-teal-900"
                  : "text-zinc-700"
              }`}
            >
              <span className="text-zinc-400">＋</span>
              Add &ldquo;{query.trim()}&rdquo;
            </li>
          ) : null}

          {optionCount === 0 ? (
            <li className="px-3 py-2 text-zinc-400">No matches</li>
          ) : null}

          {truncated ? (
            <li className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-400">
              Showing first {maxResults} — keep typing to narrow results
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
