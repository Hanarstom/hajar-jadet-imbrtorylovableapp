import { z } from 'zod';
export const chatCode = z.string().regex(/^[0-9]{6}$/, 'أدخل ID من 6 أرقام');
export const chatBody = z.string().trim().min(1, 'اكتب رسالة').max(4000);