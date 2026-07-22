import { describe, expect, it } from "vitest";
import { isRorVercelOrigin } from "./cors.js";

describe("isRorVercelOrigin", () => {
  it("accepts production and changing Rebels on Roads Vercel deployments", () => {
    expect(isRorVercelOrigin("https://ror-frontend.vercel.app")).toBe(true);
    expect(isRorVercelOrigin("https://ror-frontend-7qijozhfd-shubham-dubeys-projects-08e5e38f.vercel.app")).toBe(true);
  });

  it("rejects unrelated or lookalike deployments", () => {
    expect(isRorVercelOrigin("https://another-project.vercel.app")).toBe(false);
    expect(isRorVercelOrigin("https://ror-frontend.attacker.example")).toBe(false);
  });
});
