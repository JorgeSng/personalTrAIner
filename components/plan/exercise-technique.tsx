type Props = {
  loadmuscleUrl?: string | null;
};

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ExerciseTechnique({ loadmuscleUrl }: Props) {
  if (loadmuscleUrl && isHttpsUrl(loadmuscleUrl)) {
    return (
      <a
        href={loadmuscleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
      >
        Ver técnica
      </a>
    );
  }

  return (
    <span className="text-sm text-zinc-400">Técnica pendiente</span>
  );
}
