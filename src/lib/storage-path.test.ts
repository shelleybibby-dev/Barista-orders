import { describe, expect, it } from "vitest";
import { getPersistenceInfo, resolveOrdersPath } from "@/lib/storage-path";
import path from "node:path";

describe("order storage path", () => {
  it("uses the local data folder by default", () => {
    expect(resolveOrdersPath({}, "/app")).toBe(path.join("/app", "data", "orders.json"));
    expect(getPersistenceInfo({}, "/app")).toMatchObject({
      kind: "local-file",
      durable: false,
    });
  });

  it("prefers ORDERS_PATH when set", () => {
    expect(resolveOrdersPath({ ORDERS_PATH: "/data/queue.json" }, "/app")).toBe(
      "/data/queue.json",
    );
  });

  it("writes onto a Railway volume mount when ORDERS_PATH is not set", () => {
    expect(
      resolveOrdersPath({ RAILWAY_VOLUME_MOUNT_PATH: "/data" }, "/app"),
    ).toBe(path.join("/data", "orders.json"));
    expect(
      getPersistenceInfo({ RAILWAY_VOLUME_MOUNT_PATH: "/data" }, "/app").durable,
    ).toBe(true);
  });

  it("accepts DATA_DIR as a volume/data folder", () => {
    expect(resolveOrdersPath({ DATA_DIR: "/var/cafe" }, "/app")).toBe(
      path.join("/var/cafe", "orders.json"),
    );
  });
});
