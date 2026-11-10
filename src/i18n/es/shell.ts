/** Texts of the app shell: metadata, navigation, footer, theme switch and error pages. */
export const shell = {
  meta: {
    title: "VibeDecoder: entiende el código que generó la IA",
    titleTemplate: "%s · VibeDecoder",
    description:
      "Pega el código que te generó la IA: VibeDecoder lo explica línea por línea, lo dibuja en diagramas, señala sus riesgos y te pone un quiz para comprobar que lo entendiste.",
  },
  nav: {
    label: "Principal",
    history: "Historial",
    progress: "Progreso",
    newAnalysis: "Nuevo análisis",
    profile: "Perfil",
    signIn: "Entrar",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",
  },
  theme: { toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro" },
  footer: "VibeDecoder · Proyecto final de Programación Orientada a la Web",
  error: {
    title: "Algo salió mal",
    body: "Ocurrió un error inesperado. Puedes intentarlo de nuevo; si persiste, vuelve en unos minutos.",
    reference: "ref",
  },
  notFound: {
    title: "No encontramos esa página",
    body: "Puede que el análisis no exista o no sea tuyo.",
    action: "Ir a mi historial",
  },
} as const;
