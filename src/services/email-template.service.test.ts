import { describe, expect, it } from "vitest";
import { brandedEmail, registrationReceivedTemplate, riderApprovedTemplate } from "./email-template.service.js";

describe("email templates", () => {
  it("escapes user-controlled content", () => {
    const html = brandedEmail({ eyebrow: "Test", title: "<script>alert(1)</script>", greeting: "Hello", paragraphs: ["Safe & sound"] });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Safe &amp; sound");
  });

  it("clearly separates receipt from approval", () => {
    expect(registrationReceivedTemplate("Rider")).toContain("not a membership approval");
    expect(riderApprovedTemplate("Rider", "https://example.com")).toContain("Welcome to Rebels on Roads");
  });
});
