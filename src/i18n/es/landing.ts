/** Texts of the landing page. */
export const landing = {
  badge: "Para el código que escribió la IA y tú no",
  // Each line of the title is a whole sentence, so no big line starts in lower case.
  titleStart: "Deja de",
  titleWords: ["copiar", "pegar"],
  titleEnd: "código.",
  titleSecondLine: "Empieza a entenderlo.",
  lead: "VibeDecoder te explica línea por línea el código que te dio la IA, lo dibuja en diagramas y señala sus riesgos. Al final, un quiz comprueba que de verdad lo entendiste.",
  seeExample: "Ver un ejemplo analizado",
  cta: {
    signedIn: "Analizar mi código",
    signedOut: "Crear cuenta gratis",
    noteSignedIn: "Los códigos que ya analizaste se abren al instante y no cuentan para tu límite.",
    noteSignedOut: (limit: number) => `Gratis · ${limit} análisis nuevos al día · Sin tarjeta`,
  },
  demo: {
    title: "Pruébalo ahora, sin cuenta",
    body: "Un código real ya analizado con nivel intermedio. Pasa el mouse por las explicaciones o por el código, y recorre las pestañas de diagramas, glosario, auditoría y quiz.",
  },
  howItWorks: {
    title: "Cómo funciona",
    steps: [
      { n: "01", title: "Pega tu código", text: "En el editor, desde un archivo o con la URL de un Gist. Detectamos el lenguaje automáticamente." },
      { n: "02", title: "Elige tu nivel", text: "Principiante, intermedio o avanzado: la explicación se adapta a lo que ya sabes." },
      {
        n: "03",
        title: "Entiéndelo y compruébalo",
        text: "Lee el resumen y la explicación por bloques, revisa los diagramas y la auditoría, y responde el quiz para saber qué te falta repasar.",
      },
    ],
  },
  features: {
    title: "Pensado para entender, no solo para copiar",
    // Only features that exist in the app (each one maps to a real tab or page).
    items: {
      synced: { title: "Código y explicación sincronizados", text: "Pasa el mouse por una explicación y se resalta su código, y al revés." },
      diagrams: { title: "Diagramas de flujo, clases y secuencia", text: "Dibujados a partir de tu código y validados antes de mostrarse. Si alguno falla, la IA lo corrige." },
      levels: { title: "Adaptado a tu nivel", text: "La misma función explicada para quien empieza o para quien compara alternativas, con un glosario de cada concepto." },
      audit: { title: "Auditoría de «vibe code»", text: "Seguridad, malas prácticas, código muerto, manejo de errores y funciones que la IA pudo inventarse." },
      quiz: { title: "Quiz de comprensión", text: "Preguntas sobre ESE código. Si sacas menos del 70 %, te dice qué líneas repasar." },
      chat: { title: "Pregúntale a la IA", text: "Selecciona unas líneas y pregunta lo que no entiendas. La conversación queda guardada con el análisis." },
      progress: { title: "Tu progreso", text: "Qué conceptos dominas, cuáles conviene reforzar y cómo evoluciona tu puntaje en los quizzes." },
      share: { title: "Exportar y compartir", text: "Descárgalo en Markdown, guárdalo como PDF o comparte un enlace de solo lectura que puedes desactivar." },
      safe: { title: "Tu código nunca se ejecuta", text: "Solo se lee y se analiza. La clave de la IA vive en el servidor, no en tu navegador." },
    },
  },
  finalCta: "¿Qué código llevas copiado hoy sin entender?",
} as const;
