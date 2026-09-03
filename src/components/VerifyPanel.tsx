import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { uploadMedia } from "@/lib/media";

type Gender = "male" | "female";

/**
 * Optional identity verification: pick a gender, take a live selfie with the
 * camera (no gallery uploads), then send it for review.
 */
export function VerifyPanel({
  userId,
  status,
}: {
  userId: string;
  status: string | null | undefined;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [shot, setShot] = useState<Blob | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 640 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setCamError("تعذّر الوصول إلى الكاميرا — يرجى السماح بالوصول للمتابعة.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, shot]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      512,
      512,
    );
    canvas.toBlob(
      (b) => {
        if (!b) return;
        setShot(b);
        setShotUrl(URL.createObjectURL(b));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      },
      "image/jpeg",
      0.88,
    );
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!gender) throw new Error("اختر الجنس أولاً");
      if (!shot) throw new Error("التقط صورة سيلفي أولاً");
      const path = await uploadMedia(userId, "verify", shot);
      const { data, error } = await supabase.rpc("submit_verification", {
        _gender: gender,
        _photo_path: path,
      });
      if (error) throw error;
      if (data !== "ok") throw new Error(String(data));
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب التوثيق للمراجعة الفورية");
      setOpen(false);
      setShot(null);
      setShotUrl(null);
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (status === "pending")
    return (
      <p dir="rtl" className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm font-bold text-primary">
        ⏳ طلب التوثيق قيد المراجعة الفورية…
      </p>
    );

  if (!open)
    return (
      <Button
        variant="secondary"
        className="mt-3 w-full rounded-2xl text-base font-black"
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="me-1 h-5 w-5 text-primary" />
        {status === "rejected" ? "أعد محاولة التوثيق (اختياري)" : "توثيق الحساب (اختياري)"}
      </Button>
    );

  return (
    <div dir="rtl" className="mt-3 space-y-3 rounded-2xl border border-primary/30 bg-secondary/40 p-3 text-right">
      <div className="flex items-center justify-between">
        <span className="text-base font-black">توثيق الحساب لتفعيل السحب</span>
        <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)}>
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: "male", label: "ذكر 👨" },
            { key: "female", label: "أنثى 👩" },
          ] as const
        ).map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGender(g.key)}
            className={`rounded-xl border px-3 py-2 text-base font-bold ${
              gender === g.key
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-background/40"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-background/60">
        {shotUrl ? (
          <img src={shotUrl} alt="صورة التوثيق" className="aspect-square w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="aspect-square w-full object-cover"
          />
        )}
      </div>

      {camError && <p className="text-sm text-destructive">{camError}</p>}

      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        🔒 خصوصيتك آمنة: لا أحد يستطيع رؤية صورتك، يتم إرسالها للروبوت الصناعي للتحقق الفوري.
      </p>

      {shot ? (
        <div className="flex gap-2">
          <Button
            className="flex-1 rounded-full font-bold"
            disabled={submit.isPending || !gender}
            onClick={() => submit.mutate()}
          >
            إرسال للتحقق
          </Button>
          <Button
            variant="secondary"
            className="rounded-full font-bold"
            onClick={() => {
              setShot(null);
              setShotUrl(null);
            }}
          >
            إعادة الالتقاط
          </Button>
        </div>
      ) : (
        <Button className="w-full rounded-full font-bold" onClick={capture} disabled={!!camError}>
          <Camera className="me-1 h-5 w-5" /> التقاط سيلفي
        </Button>
      )}
    </div>
  );
}
