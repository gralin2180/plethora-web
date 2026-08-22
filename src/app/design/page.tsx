import { redirect } from "next/navigation";

/** Internal architecture notes are not a product surface. */
export default function DesignPage() {
  redirect("/about");
}
