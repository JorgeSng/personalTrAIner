import { redirect } from "next/navigation";

import { HomeShell } from "@/components/auth/home-shell";
import { buildLoginRedirect } from "@/lib/auth/paths";
import { getUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    redirect(buildLoginRedirect("/"));
  }

  return <HomeShell email={user.email ?? user.id} />;
}
