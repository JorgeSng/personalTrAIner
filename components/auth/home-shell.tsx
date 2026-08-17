import { LogoutButton } from "@/components/auth/logout-button";

type Props = {
  email: string;
};

export function HomeShell({ email }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500">MVP personal · SDD</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">
          personalTrAIner
        </h1>
        <p className="mt-3 text-lg text-zinc-600">Sesión iniciada</p>
        <p className="mt-1 text-sm text-zinc-700">{email}</p>
      </div>
      <LogoutButton />
    </main>
  );
}
