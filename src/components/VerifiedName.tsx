import { BadgeCheck } from "lucide-react";

/** Verified users get a gender colour (blue = male, pink = female) + official badge. */
export function verifiedNameClass(
  gender: string | null | undefined,
  isVerified: boolean | null | undefined,
) {
  if (!isVerified) return "";
  return gender === "female" ? "text-pink-400" : "text-sky-400";
}

export function VerifiedBadge({
  gender,
  isVerified,
  withLabel = false,
}: {
  gender?: string | null;
  isVerified?: boolean | null;
  withLabel?: boolean;
}) {
  if (!isVerified) return null;
  const color = gender === "female" ? "text-pink-400" : "text-sky-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${color}`}>
      <BadgeCheck className="h-4 w-4" />
      {withLabel && <span>🛡️ موثق بحماية غوغل</span>}
    </span>
  );
}
