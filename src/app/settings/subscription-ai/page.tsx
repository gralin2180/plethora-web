import { redirect } from "next/navigation";

export default function SubscriptionAiRedirect() {
  redirect("/get-started?provider=chatgpt");
}
