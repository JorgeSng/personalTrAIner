export const PLAN_EMPTY_COPY =
  "Todavía no tienes un plan activo. Genera uno para empezar.";

export const PLAN_GENERATING_LABEL = "Generando plan…";

export const PLAN_NETWORK_ERROR =
  "No se ha podido conectar. Inténtalo de nuevo.";

export const PLAN_GENERIC_ERROR =
  "No se ha podido generar el plan. Inténtalo de nuevo.";

export const PLAN_GEMINI_CONFIG_ERROR =
  "Gemini no está configurado. Define GEMINI_API_KEY en el servidor (ver .env.example).";

export const PLAN_GEMINI_FAILED_ERROR =
  "La generación del plan ha fallado. Inténtalo de nuevo.";

export const PLAN_PROFILE_REQUIRED_ERROR =
  "Necesitas completar el onboarding antes de generar un plan.";

export function planGenerateErrorMessage(code: string | undefined): string {
  switch (code) {
    case "GEMINI_NOT_CONFIGURED":
      return PLAN_GEMINI_CONFIG_ERROR;
    case "GEMINI_INVALID_PLAN":
    case "GEMINI_REQUEST_FAILED":
      return PLAN_GEMINI_FAILED_ERROR;
    case "PROFILE_REQUIRED":
      return PLAN_PROFILE_REQUIRED_ERROR;
    default:
      return PLAN_GENERIC_ERROR;
  }
}
