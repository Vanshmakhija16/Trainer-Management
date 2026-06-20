/**
 * Avatar — shows a profile photo when available, otherwise a deterministic
 * colored block with the person's initials. Server-component friendly (no
 * client JS). Square by default to suit the rectangular profile cards.
 */

const PALETTE = [
  "bg-teal-100 text-teal-800",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
  "bg-indigo-100 text-indigo-800",
  "bg-cyan-100 text-cyan-800",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
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
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${rounded} object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`grid place-items-center font-semibold ${rounded} ${colorFor(name)} ${className}`}
    >
      <span className="text-[clamp(0.9rem,40%,2rem)]">{initialsOf(name)}</span>
    </div>
  );
}
