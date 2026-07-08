import { redirect } from "next/navigation";

// /menu-online → redirect al canonical /menu-digital
export default function MenuOnlinePage() {
  redirect("/menu-digital");
}
