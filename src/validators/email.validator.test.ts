import { describe, expect, it } from "vitest";
import { sendAdminEmailSchema } from "./email.validator.js";

describe("sendAdminEmailSchema", () => {
  it("requires recipients for a custom audience", () => {
    const result = sendAdminEmailSchema.safeParse({ body: { audience: "custom", category: "custom", subject: "Test subject", message: "A sufficiently long message", customRecipients: [] } });
    expect(result.success).toBe(false);
  });

  it("accepts an approved-rider announcement", () => {
    const result = sendAdminEmailSchema.safeParse({ body: { audience: "approvedRiders", category: "ride-update", subject: "Ride briefing", message: "Assembly instructions for approved riders", customRecipients: [] } });
    expect(result.success).toBe(true);
  });
});
