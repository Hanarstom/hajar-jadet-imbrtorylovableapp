/** Reels activity meter (0 / 60) used to unlock the inviter's full referral reward. */
export function ActivityMeter({ watched }: { watched: number }) {
  const target = 60;
  const done = Math.min(watched, target);
  const pct = Math.round((done / target) * 100);
  return (
    <div dir="rtl" className="mt-3 rounded-2xl border border-primary/30 bg-secondary/40 p-3 text-right">
      <div className="flex items-center justify-between text-sm font-black">
        <span>مستوى النشاط والريلز</span>
        <span className="neon-text">
          {done} / {target} ريلز
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-background/70">
        <div
          className="h-full rounded-full bg-primary shadow-neon transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">
        {done >= target
          ? "✅ اكتمل شرط النشاط بنجاح، شكراً لك!"
          : "🎯 أكمل مهامك ليحصل صديقك على الدعم الكامل"}
      </p>
    </div>
  );
}
