import { describe, expect, it } from "vitest";
import { maskAadhaar } from "./mask.js";

describe("maskAadhaar", () => {
  it("reveals only the final four digits", () => {
    expect(maskAadhaar("123456789012")).toBe("XXXX XXXX 9012");
  });
});
