import { BaristaQueue } from "@/components/barista/BaristaQueue";
import { getMenu } from "@/lib/menu";
import { getStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default function BaristaPage() {
  const menu = getMenu();
  return <BaristaQueue cafeName={menu.cafeName} staff={getStaff()} />;
}
