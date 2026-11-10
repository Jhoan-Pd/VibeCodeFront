/** Texts of the print view («Guardar como PDF»), the public link page and their toolbars. */
export const print = {
  metaTitle: "Imprimir análisis",
  sharedMetaTitle: "Imprimir análisis compartido",
  hint: "En el diálogo de impresión elige «Guardar como PDF».",
  action: "Imprimir o guardar PDF",
  subtitle: (language: string, level: string, date: string) => `${language} · nivel ${level.toLowerCase()} · ${date} · generado con VibeDecoder`,
} as const;

export const shared = {
  metaTitle: "Análisis compartido",
  readOnly: "Solo lectura",
  print: "Imprimir o PDF",
  noticeTitle: "Te compartieron este análisis",
  noticeBefore: "Lo generó VibeDecoder a partir de código escrito con IA. ",
  noticeLink: "Crea una cuenta gratis",
  noticeAfter: " para analizar tu propio código, responder quizzes y preguntarle a la IA sobre cada línea.",
} as const;
