import { describe, expect, it } from "vitest";
import { escapeRegex } from "./regex.js";

describe("escapeRegex", () => {
  it("treats user-provided regex operators as literal text", () => {
    const expression = new RegExp(escapeRegex("(a+)+$"), "i");
    expect(expression.test("prefix (a+)+$ suffix")).toBe(true);
    expect(expression.test("aaaaaaaa")).toBe(false);
  });
});
