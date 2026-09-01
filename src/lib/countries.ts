export type Country = { code: string; name: string; flag: string };

/** Countries offered at signup (Arabic names + flags). */
export const COUNTRIES: Country[] = [
  { code: "SY", name: "سوريا", flag: "🇸🇾" },
  { code: "JO", name: "الأردن", flag: "🇯🇴" },
  { code: "SA", name: "السعودية", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪" },
  { code: "EG", name: "مصر", flag: "🇪🇬" },
  { code: "IQ", name: "العراق", flag: "🇮🇶" },
  { code: "LB", name: "لبنان", flag: "🇱🇧" },
  { code: "PS", name: "فلسطين", flag: "🇵🇸" },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "OM", name: "عمان", flag: "🇴🇲" },
  { code: "YE", name: "اليمن", flag: "🇾🇪" },
  { code: "SD", name: "السودان", flag: "🇸🇩" },
  { code: "LY", name: "ليبيا", flag: "🇱🇾" },
  { code: "TN", name: "تونس", flag: "🇹🇳" },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿" },
  { code: "MA", name: "المغرب", flag: "🇲🇦" },
  { code: "MR", name: "موريتانيا", flag: "🇲🇷" },
  { code: "SO", name: "الصومال", flag: "🇸🇴" },
  { code: "DJ", name: "جيبوتي", flag: "🇩🇯" },
  { code: "KM", name: "جزر القمر", flag: "🇰🇲" },
  { code: "TR", name: "تركيا", flag: "🇹🇷" },
  { code: "IR", name: "إيران", flag: "🇮🇷" },
  { code: "PK", name: "باكستان", flag: "🇵🇰" },
  { code: "IN", name: "الهند", flag: "🇮🇳" },
  { code: "ID", name: "إندونيسيا", flag: "🇮🇩" },
  { code: "MY", name: "ماليزيا", flag: "🇲🇾" },
  { code: "BD", name: "بنغلاديش", flag: "🇧🇩" },
  { code: "AF", name: "أفغانستان", flag: "🇦🇫" },
  { code: "DE", name: "ألمانيا", flag: "🇩🇪" },
  { code: "FR", name: "فرنسا", flag: "🇫🇷" },
  { code: "GB", name: "بريطانيا", flag: "🇬🇧" },
  { code: "NL", name: "هولندا", flag: "🇳🇱" },
  { code: "SE", name: "السويد", flag: "🇸🇪" },
  { code: "NO", name: "النرويج", flag: "🇳🇴" },
  { code: "DK", name: "الدنمارك", flag: "🇩🇰" },
  { code: "ES", name: "إسبانيا", flag: "🇪🇸" },
  { code: "IT", name: "إيطاليا", flag: "🇮🇹" },
  { code: "GR", name: "اليونان", flag: "🇬🇷" },
  { code: "RU", name: "روسيا", flag: "🇷🇺" },
  { code: "UA", name: "أوكرانيا", flag: "🇺🇦" },
  { code: "US", name: "أمريكا", flag: "🇺🇸" },
  { code: "CA", name: "كندا", flag: "🇨🇦" },
  { code: "BR", name: "البرازيل", flag: "🇧🇷" },
  { code: "AR", name: "الأرجنتين", flag: "🇦🇷" },
  { code: "AU", name: "أستراليا", flag: "🇦🇺" },
  { code: "NG", name: "نيجيريا", flag: "🇳🇬" },
  { code: "KE", name: "كينيا", flag: "🇰🇪" },
  { code: "ZA", name: "جنوب أفريقيا", flag: "🇿🇦" },
  { code: "CN", name: "الصين", flag: "🇨🇳" },
  { code: "JP", name: "اليابان", flag: "🇯🇵" },
  { code: "KR", name: "كوريا الجنوبية", flag: "🇰🇷" },
  { code: "PH", name: "الفلبين", flag: "🇵🇭" },
];

export function countryFlag(code: string | null | undefined) {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.flag ?? "";
}

export function countryName(code: string | null | undefined) {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? code;
}
