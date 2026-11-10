/** Texts of the analysis page (header, status alerts, export and sharing). */
export const analysis = {
  metaTitle: "Resultado del análisis",
  backToHistory: "Historial",
  level: (label: string) => `Nivel ${label.toLowerCase()}`,
  regenerate: {
    summary: "Regenerar resumen",
    lines: "Regenerar explicación",
    diagram: "Regenerar diagramas",
    glossary: "Generar glosario",
    audit: "Auditar código",
    quiz: "Generar quiz",
  },
  cacheTitle: "Resultado recuperado de la caché",
  cacheBody: (level: string) =>
    `Este mismo código ya se había analizado con el nivel ${level.toLowerCase()}, así que se reutilizó el resultado al instante: no se llamó a la IA ni se descontó de tu límite diario. Si quieres una explicación nueva, marca «Ignorar caché» al analizar.`,
  processingTitle: "Este análisis todavía se está procesando",
  processingBody: "Se actualizará solo en unos segundos.",
  failedTitle: "El análisis no se pudo completar",
  partialTitle: "Algunas secciones no se pudieron generar",
  interrupted: "El proceso se interrumpió antes de terminar.",
  loading: "Cargando el análisis",
  actions: {
    markdown: "Markdown",
    pdf: "PDF",
    share: "Compartir",
    shared: "Compartido",
    panelTitle: "Enlace público de solo lectura",
    panelBody:
      "Quien tenga el enlace verá el código, las explicaciones, los diagramas, el glosario y la auditoría. No verá tu nombre, tu chat ni tus resultados del quiz.",
    linkLabel: "Enlace público",
    copyLink: "Copiar enlace",
    copyFailed: "No se pudo copiar: selecciona el enlace y cópialo a mano.",
    stopSharing: "Dejar de compartir",
    createLink: "Crear enlace",
    updateFailed: "No se pudo actualizar el enlace.",
  },
} as const;
