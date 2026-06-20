"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "./avatar";

/**
 * Instagram-style avatar: clicking it opens a lightbox with the photo enlarged.
 * Falls back to the initials block (also enlargeable) when there's no photo.
 * Stops click propagation so it can sit inside a card that links elsewhere.
 */
export function AvatarLightbox({
  name,
  src,
  className = "",
  rounded = "rounded-xl",
}: {
  name: string;
  src?: string | null;
  className?: string;
  rounded?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // Prevent background scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`View ${name}'s photo`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${rounded} ring-teal-500/0 transition hover:ring-2 hover:ring-teal-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
      >
        <Avatar name={name} src={src} rounded={rounded} className={className} />
      </button>

      {open && mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${name}'s photo`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
              className="fixed inset-0 z-100 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
            >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-4"
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={name}
                className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <Avatar
                name={name}
                rounded="rounded-2xl"
                className="size-64 text-7xl shadow-2xl"
              />
            )}
            <p className="text-sm font-medium text-white/90">{name}</p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
