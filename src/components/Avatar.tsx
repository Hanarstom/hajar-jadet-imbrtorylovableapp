import { cn } from "@/lib/utils";
import { useMediaUrl } from "@/lib/media";

export function Avatar({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}) {
  const url = useMediaUrl(src);
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-full border border-primary/30 bg-secondary font-semibold",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={`${name ?? "User"} avatar`} className="h-full w-full object-cover" />
      ) : (
        (name || "?").charAt(0).toUpperCase()
      )}
    </span>
  );
}
