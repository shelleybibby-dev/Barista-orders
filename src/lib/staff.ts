import fs from "node:fs";
import path from "node:path";

const STAFF_PATH = path.join(process.cwd(), "data", "staff.json");
const FALLBACK_STAFF = ["Alex", "Sam", "Jordan"];

export function sanitiseStaffName(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 40);
}

export function getStaff(): string[] {
  try {
    const raw = fs.readFileSync(STAFF_PATH, "utf8");
    const parsed = JSON.parse(raw) as { staff?: unknown };
    if (!Array.isArray(parsed.staff)) return FALLBACK_STAFF;

    const names = [
      ...new Set(
        parsed.staff
          .filter((item): item is string => typeof item === "string")
          .map(sanitiseStaffName)
          .filter(Boolean),
      ),
    ];
    return names.length > 0 ? names : FALLBACK_STAFF;
  } catch {
    return FALLBACK_STAFF;
  }
}

export function isKnownStaff(name: string): boolean {
  return getStaff().includes(name);
}
