import { describe, expect, it } from "vitest";
import { getStaff, isKnownStaff, sanitiseStaffName } from "@/lib/staff";

describe("staff list", () => {
  it("loads editable placeholder names", () => {
    expect(getStaff()).toEqual(["Alex", "Sam", "Jordan"]);
    expect(isKnownStaff("Alex")).toBe(true);
    expect(isKnownStaff("Sam")).toBe(true);
    expect(isKnownStaff("Jordan")).toBe(true);
    expect(isKnownStaff("Not a barista")).toBe(false);
  });

  it("trims and shortens a staff name", () => {
    expect(sanitiseStaffName("  Alex  ")).toBe("Alex");
    expect(sanitiseStaffName("A".repeat(50))).toHaveLength(40);
  });
});
