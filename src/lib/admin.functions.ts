import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passSchema = z.object({ pass: z.string().min(1).max(200) });

const reviewSchema = z.object({
  pass: z.string().min(1).max(200),
  userId: z.string().uuid(),
  approve: z.boolean(),
});

export const fetchPendingVerifications = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passSchema.parse(data))
  .handler(async ({ data }) => {
    const { listPendingVerifications } = await import("./admin.server");
    return await listPendingVerifications(data.pass);
  });

export const reviewVerificationFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const { reviewVerification } = await import("./admin.server");
    return await reviewVerification(data.pass, data.userId, data.approve);
  });
