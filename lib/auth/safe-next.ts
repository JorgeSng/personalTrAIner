const HOME_PATH = "/";

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) {
    return HOME_PATH;
  }

  const value = next.trim();

  if (!value.startsWith("/")) {
    return HOME_PATH;
  }

  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return HOME_PATH;
  }

  return value;
}
