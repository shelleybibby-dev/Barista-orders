import { BaristaQueue } from "@/components/barista/BaristaQueue";
import { getMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default function BaristaPage() {
  const menu = getMenu();
  return <BaristaQueue cafeName={menu.cafeName} />;
}
