import { CustomerKiosk } from "@/components/customer/CustomerKiosk";
import { getMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default function CustomerPage() {
  return <CustomerKiosk menu={getMenu()} />;
}
