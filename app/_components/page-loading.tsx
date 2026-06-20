export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-teal-600"
        aria-hidden
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
