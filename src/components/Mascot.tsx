import { useEffect, useMemo, useState } from "react";

/** Faces + outfits combine into 100+ different mascot looks. */
const FACES = [
  "😃","😄","😁","😆","😅","🤣","😊","🙂","😉","😍","🥳","😎","🤓","🧐","🤠","🥸",
  "😜","🤪","😝","🤗","🤭","🤔","🤨","😐","😑","😏","🙃","😇","🥰","😻","🤩","😺",
  "🥲","😌","😔","😴","🤤","🫡","🫠","🤡","👻","🤖","👽","🐵","🐶","🐱","🦊","🐼",
];
const OUTFITS = ["👔","🎩","🕴️","🧥","👕","🦺","🎀","🧣","💼","🕶️"];
const HAIRS = ["➰➰➰", "〰️〰️〰️", "🌀🌀", "➿➿", "➰➿➰"];

const LINES = [
  "يلا نشووووور ياعمي",
  "يلا تصفح شو وراك",
  "تسلا وحقق شرط من يلي يعجبك",
  "تسلا وخود ربح بعدين",
  "شو ناطر اعزمك عكاسة متة 🤣",
  "او كاسة شاي بدك عزيمة لتنشر🤣🤣",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

/** Walking cartoon mascot that roams empty bottom corners without covering reels. */
export function Mascot() {
  const [look, setLook] = useState(() => ({
    face: FACES[0]!,
    outfit: OUTFITS[0]!,
    hair: HAIRS[0]!,
  }));
  const [line, setLine] = useState(LINES[0]!);
  const [side, setSide] = useState<"left" | "right">("left");
  const [step, setStep] = useState(0);

  useEffect(() => {
    setLook({ face: pick(FACES), outfit: pick(OUTFITS), hair: pick(HAIRS) });
    setLine(pick(LINES));
    const lookId = window.setInterval(
      () => setLook({ face: pick(FACES), outfit: pick(OUTFITS), hair: pick(HAIRS) }),
      7000,
    );
    const lineId = window.setInterval(() => setLine(pick(LINES)), 5200);
    const walkId = window.setInterval(() => {
      setStep((v) => (v + 1) % 3);
      if (Math.random() > 0.6) setSide((s) => (s === "left" ? "right" : "left"));
    }, 3400);
    return () => {
      window.clearInterval(lookId);
      window.clearInterval(lineId);
      window.clearInterval(walkId);
    };
  }, []);

  const offset = useMemo(() => [0, 14, 28][step]!, [step]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-24 z-10 select-none transition-all duration-1000 ease-in-out"
      style={
        side === "left"
          ? { left: 6 + offset, right: "auto" }
          : { right: 6 + offset, left: "auto" }
      }
    >
      <div dir="rtl" className="flex w-[120px] flex-col items-center">
        <div className="animate-fade-in rounded-2xl border border-primary/40 bg-background/85 px-2 py-1 text-center text-[11px] font-black leading-tight text-primary shadow-neon backdrop-blur">
          {line}
        </div>
        <span className="mt-0.5 text-[8px] leading-none text-primary/70">▼</span>

        <div className="animate-[mascot-bob_1.1s_ease-in-out_infinite] flex flex-col items-center leading-none">
          <span className="text-[11px] tracking-[-2px]">{look.hair}</span>
          <span className="text-3xl">{look.face}</span>
          <div className="flex items-center gap-0.5 text-lg">
            <span className="animate-[mascot-arm_0.7s_ease-in-out_infinite] inline-block">🤚</span>
            <span className="text-2xl">{look.outfit}</span>
            <span className="animate-[mascot-arm_0.7s_ease-in-out_infinite_reverse] inline-block">
              ✋
            </span>
          </div>
          <div className="flex gap-1 text-base">
            <span className="animate-[mascot-leg_0.55s_ease-in-out_infinite] inline-block">🦶</span>
            <span className="animate-[mascot-leg_0.55s_ease-in-out_infinite_reverse] inline-block">
              🦶
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
