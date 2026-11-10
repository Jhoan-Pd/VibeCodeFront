import type {
  ComprehensionLevel,
  DiagramKind,
  FindingKind,
  Level,
  MasteryStatus,
  QuestionKind,
  Severity,
  Stage,
} from "@/types/analysis-view";

/**
 * Texts shared by every screen. Error messages follow one structure across the app:
 * what happened + what the person can do, so the same problem is explained the same way everywhere.
 */
export const common = {
  appName: "VibeDecoder",
  plainText: "Texto",
  loading: "Cargando…",
  retry: "Reintentar",
  cancel: "Cancelar",
  close: "Cerrar",
  save: "Guardar",
  saving: "Guardando…",
  copy: "Copiar",
  copied: "Copiado",
  back: "Volver",
  lineRange: (start: number, end: number | null) => (end == null || end === start ? `L${start}` : `L${start}–${end}`),
} as const;

export const errors = {
  noConnection: "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
  serverWakingUp: "El servidor está despertando (tarda unos 50 segundos tras un rato sin uso). Inténtalo de nuevo en un momento.",
  timeout: "El servidor tardó demasiado en responder. Inténtalo de nuevo.",
  sessionExpired: "Tu sesión venció. Vuelve a iniciar sesión.",
  unexpected: "Ocurrió un error inesperado. Inténtalo de nuevo.",
  notFound: "No encontramos lo que buscas.",
} as const;

export const labels = {
  level: {
    BEGINNER: { label: "Principiante", description: "Explicaciones paso a paso, con analogías y sin dar nada por sabido." },
    INTERMEDIATE: { label: "Intermedio", description: "Directo al punto: explica lo no obvio y nombra los patrones." },
    ADVANCED: { label: "Avanzado", description: "Decisiones de diseño, complejidad, casos límite y trade-offs." },
  } satisfies Record<Level, { label: string; description: string }>,

  stage: {
    summary: { label: "Resumen general", detail: "Qué hace, entradas, salidas y dependencias" },
    lines: { label: "Explicación línea por línea", detail: "Bloques lógicos adaptados a tu nivel" },
    diagram: { label: "Diagramas", detail: "Flujo y, si aplica, clases y secuencia" },
    glossary: { label: "Glosario", detail: "Conceptos que usa el código" },
    audit: { label: "Auditoría de vibe code", detail: "Seguridad, errores y posibles alucinaciones" },
    quiz: { label: "Quiz de comprensión", detail: "Preguntas sobre este código" },
  } satisfies Record<Stage, { label: string; detail: string }>,

  diagramKind: { FLOW: "Flujo", CLASS: "Clases", SEQUENCE: "Secuencia" } satisfies Record<DiagramKind, string>,

  findingKind: {
    SECURITY: "Seguridad",
    BAD_PRACTICE: "Mala práctica",
    DEAD_CODE: "Código muerto",
    ERROR_HANDLING: "Manejo de errores",
    HALLUCINATION: "Posible alucinación de la IA",
  } satisfies Record<FindingKind, string>,

  severity: { CRITICAL: "Crítica", HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" } satisfies Record<Severity, string>,

  questionKind: {
    MULTIPLE_CHOICE: "Opción múltiple",
    WHAT_PRINTS: "¿Qué imprime o retorna?",
    TRUE_FALSE: "Verdadero o falso",
    WHAT_IF: "¿Qué pasa si…?",
    ORDERING: "Ordena los pasos",
  } satisfies Record<QuestionKind, string>,

  comprehension: { EXCELLENT: "Excelente", GOOD: "Buena", PARTIAL: "Parcial", INSUFFICIENT: "Insuficiente" } satisfies Record<ComprehensionLevel, string>,

  mastery: { mastered: "Dominado", in_progress: "En progreso", needs_review: "Por reforzar" } satisfies Record<MasteryStatus, string>,

  trueFalse: { true: "Verdadero", false: "Falso" },
} as const;
