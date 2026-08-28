export const SESSION_SUCCESS_COPY = "Sesión guardada";

export const SESSION_HELP_COPY =
  "Indica series, peso (kg) y reps reales. Deja peso vacío si es a peso corporal.";

export const SESSION_REGISTER_CTA = "Registrar sesión";

export const SESSION_SAVE_CTA = "Guardar sesión";

export const SESSION_CANCEL_CTA = "Cancelar";

export const SESSION_SUBMITTING_LABEL = "Guardando sesión…";

export const SESSION_NETWORK_ERROR =
  "No se ha podido conectar. Inténtalo de nuevo.";

export const SESSION_GENERIC_ERROR =
  "No se ha podido guardar la sesión. Inténtalo de nuevo.";

export const SESSION_SERVICE_UNAVAILABLE =
  "El servicio no está disponible ahora. Inténtalo más tarde.";

export const SESSION_PLAN_NOT_FOUND =
  "No se encontró el plan. Puede que se haya regenerado; recarga la página.";

export const SESSION_VALIDATION_ERROR =
  "Revisa los datos del formulario e inténtalo de nuevo.";

export const SESSION_VALIDATION_NO_EXERCISES =
  "Marca al menos un ejercicio con series hechas y reps.";

export const SESSION_VALIDATION_FUTURE_DATE =
  "La fecha no puede ser futura.";

export const SESSION_VALIDATION_INVALID_WEIGHT =
  "El peso debe ser un número válido (0 o más).";

export const SESSION_VALIDATION_INVALID_SETS =
  "Las series hechas deben ser un número entero de 1 o más.";

export const SESSION_REPS_PLACEHOLDER = "10,10,8";

export function sessionErrorMessage(
  code: string | undefined,
  apiMessage?: string,
): string {
  switch (code) {
    case "PLAN_NOT_FOUND":
      return SESSION_PLAN_NOT_FOUND;
    case "VALIDATION_ERROR":
      return apiMessage?.trim() || SESSION_VALIDATION_ERROR;
    case "SUPABASE_NOT_CONFIGURED":
      return SESSION_SERVICE_UNAVAILABLE;
    default:
      return SESSION_GENERIC_ERROR;
  }
}
