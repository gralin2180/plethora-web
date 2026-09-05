import { redirect } from "next/navigation";

/** Legacy URL — main hub is now /office */
export default function OfficeDownloadsRedirect() {
  redirect("/office");
}
