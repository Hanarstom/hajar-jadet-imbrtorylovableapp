export function SponsoredSlot({ id }: { id: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Sponsored Content
      </p>
      {/* Paste your Adsterra banner code inside this container (id: {id}) */}
      <div
        id={`adsterra-${id}`}
        className="flex h-[90px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
      >
        Adsterra 728x90 banner slot
      </div>
    </div>
  );
}
