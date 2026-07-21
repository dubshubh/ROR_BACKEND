import { beforeEach, describe, expect, it, vi } from "vitest";

const { destroy } = vi.hoisted(() => ({ destroy: vi.fn() }));
vi.mock("../config/cloudinary.js", () => ({
  cloudinary: { uploader: { destroy, upload_stream: vi.fn() } }
}));

import { deleteAssets } from "./cloudinary.service.js";

describe("deleteAssets", () => {
  beforeEach(() => destroy.mockReset());

  it("attempts every cleanup even if one deletion fails", async () => {
    destroy.mockRejectedValueOnce(new Error("first failed")).mockResolvedValueOnce({ result: "ok" });
    const result = await deleteAssets([{ publicId: "first" }, { publicId: "second" }]);
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(result.failedCount).toBe(1);
  });

  it("ignores absent optional assets", async () => {
    const result = await deleteAssets([null, undefined]);
    expect(destroy).not.toHaveBeenCalled();
    expect(result.failedCount).toBe(0);
  });
});
