/** Texts of the history (dashboard) page. */
export const dashboard = {
  metaTitle: "Historial",
  title: "Tu historial",
  count: (n: number) => (n === 0 ? "Aún no has analizado nada." : `${n} análisis guardado${n === 1 ? "" : "s"}.`),
  myProgress: "Mi progreso",
  newAnalysis: "Nuevo análisis",
  emptyTitle: "Tu primer análisis te está esperando",
  emptyBody: "Pega ese código que la IA te generó y no terminas de entender. Aquí quedará guardado con su explicación y su diagrama.",
  emptyAction: "Analizar mi primer código",
  loading: "Cargando tu historial",
  status: { COMPLETED: "Completo", PROCESSING: "Procesando", PENDING: "Pendiente", FAILED: "Con errores" },
  delete: {
    label: "Eliminar análisis",
    confirm: "Eliminar",
    failed: "No se pudo eliminar.",
  },
} as const;
