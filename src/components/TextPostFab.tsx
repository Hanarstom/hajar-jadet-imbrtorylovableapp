import { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/useSession";

/** Big floating "+" that opens a modal for publishing a quick text post. */
export function TextPostFab() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("سجّل الدخول للنشر");
      const text = body.trim();
      if (!text) throw new Error("اكتب شيئاً أولاً");
      const { error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content: text, platform: "text" });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      setOpen(false);
      toast.success("تم نشر المنشور");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  return (
    <>
      <Button
        type="button"
        aria-label="منشور نصي جديد"
        onClick={() => setOpen(true)}
        className="create-post fixed left-4 z-40 h-12 w-28 rounded-full border border-destructive bg-destructive text-destructive-foreground shadow-create hover:bg-destructive/90 sm:left-8"
      >
        <Plus className="size-7" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md text-right">
          <DialogHeader>
            <DialogTitle className="text-right text-lg">منشور نصي جديد</DialogTitle>
          </DialogHeader>
          <Textarea
            dir="rtl"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="بم تفكر؟"
            rows={5}
            maxLength={1000}
          />
          <Button
            className="w-full text-base font-bold"
            onClick={() => publish.mutate()}
            disabled={publish.isPending}
          >
            نشر
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
