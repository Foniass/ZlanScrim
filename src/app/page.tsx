import { redirect } from "next/navigation";

export default function RootRedirect() {
  // / is just a router — actual landing is Inscriptions (public-friendly).
  redirect("/inscriptions");
}
