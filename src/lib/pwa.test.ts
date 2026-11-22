import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Home Screen web app manifests", () => {
  it("opens barista and customer as standalone apps", () => {
    const barista = JSON.parse(readFileSync("public/barista.webmanifest", "utf8"));
    const customer = JSON.parse(readFileSync("public/customer.webmanifest", "utf8"));

    expect(barista.display).toBe("standalone");
    expect(barista.start_url).toBe("/barista");
    expect(barista.short_name).toBe("Barista");

    expect(customer.display).toBe("standalone");
    expect(customer.start_url).toBe("/customer");
    expect(customer.short_name).toBe("Orders");
  });
});
