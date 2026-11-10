/** Texts of the Markdown export (the document the person downloads). */
export const exportMarkdown = {
  generatedWith: (language: string, level: string, date: string) => `Análisis generado con VibeDecoder · ${language} · nivel ${level} · ${date}`,
  publicLink: "Enlace público",
  summary: "Resumen",
  inputs: "Entradas",
  outputs: "Salidas",
  dependencies: "Dependencias",
  code: "Código",
  blocks: "Explicación por bloques",
  diagrams: "Diagramas",
  glossary: "Glosario",
  audit: "Auditoría de vibe code",
  noFindings: "Sin hallazgos.",
  suggestion: "Sugerencia",
  quiz: "Quiz de autoevaluación",
  quizNoAnswers: "_Las respuestas no se incluyen: respóndelo en VibeDecoder para recibir la calificación._",
  defaultFileName: "analisis",
} as const;
