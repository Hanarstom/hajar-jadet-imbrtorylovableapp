import { useEffect, useRef } from "react";

export function InfiniteScrollTrigger({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div ref={ref} className="py-3 text-center text-sm text-muted-foreground">
      {loading ? "جارٍ تحميل المزيد…" : hasMore ? "" : "وصلت إلى نهاية الريلز"}
    </div>
  );
}