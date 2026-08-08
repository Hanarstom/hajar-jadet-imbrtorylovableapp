import { useEffect, useState } from "react";

const LINES = [
  "شايفك عم تعلق أو تشاهد هههه 🤪",
  "إيه جيب مشتركين لحق بجرياتك ودياتك 😜",
  "شو فوتوا عالمنصة؟ اجيتوا من الإعلان؟ 😂",
  "حابين تحققوا الشروط؟ 😲",
  "انتبهت المنصة سهلة؟ بلش ربنا يحقق حلمي 😍❤️❤️",
];

const FACES = ["🤪", "😜", "😂", "😲", "😍"];

/** Small emoji that rolls across the top with spontaneous Arabic lines. */
export function RollingEmoji() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % LINES.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div dir="rtl" className="flex flex-col items-center gap-1 py-1 text-center">
      <p
        key={i}
        className="animate-fade-in rounded-full bg-secondary/70 px-3 py-1 text-[11px] font-bold text-primary shadow-neon"
      >
        {LINES[i]}
      </p>
      <span className="animate-[emoji-roll_4.2s_ease-in-out_infinite] text-2xl leading-none">
        {FACES[i]}
      </span>
    </div>
  );
}
