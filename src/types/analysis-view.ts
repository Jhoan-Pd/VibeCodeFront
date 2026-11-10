/**
 * View models of the frontend. Components only know these plain types (string unions, ISO dates,
 * null for "absent"); the protobuf messages of the API are converted at the edge by lib/rpc/mappers.ts.
 * Every type is serializable, so Server Components can pass them to Client Components as props.
 */

export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type Level = (typeof LEVELS)[number];

export const ANALYSIS_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

/** Analysis stages, in display order. */
export const STAGES = ["summary", "lines", "diagram", "glossary", "audit", "quiz"] as const;
export type Stage = (typeof STAGES)[number];

/** Diagram kinds, in tab order. */
export const DIAGRAM_KINDS = ["FLOW", "CLASS", "SEQUENCE"] as const;
export type DiagramKind = (typeof DIAGRAM_KINDS)[number];

export const FINDING_KINDS = ["SECURITY", "BAD_PRACTICE", "DEAD_CODE", "ERROR_HANDLING", "HALLUCINATION"] as const;
export type FindingKind = (typeof FINDING_KINDS)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const QUESTION_KINDS = ["MULTIPLE_CHOICE", "WHAT_PRINTS", "TRUE_FALSE", "WHAT_IF", "ORDERING"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const COMPREHENSION_LEVELS = ["EXCELLENT", "GOOD", "PARTIAL", "INSUFFICIENT"] as const;
export type ComprehensionLevel = (typeof COMPREHENSION_LEVELS)[number];

/** Pass mark of the quiz: below it the result recommends reviewing the code. */
export const PASS_MARK = 70;

export interface LineRange {
  start: number;
  end: number;
}

export interface Summary {
  purpose: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
}

export interface Block {
  lineStart: number;
  lineEnd: number;
  title: string;
  explanation: string;
}

export interface DiagramView {
  kind: DiagramKind;
  title: string;
  mermaid: string;
}

export interface ConceptView {
  name: string;
  explanation: string;
  lineStart: number | null;
  lineEnd: number | null;
}

export interface FindingView {
  kind: FindingKind;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  lineStart: number | null;
  lineEnd: number | null;
}

/** An answer: option index, boolean (TRUE_FALSE) or displayed positions in execution order (ORDERING). */
export type AnswerValue = number | boolean | number[];

/** A question as shown before answering: never the correct answer nor the explanation. */
export interface PublicQuestion {
  id: string;
  position: number;
  kind: QuestionKind;
  prompt: string;
  options: string[] | null;
  lineStart: number | null;
  lineEnd: number | null;
  concept: string | null;
}

export interface AttemptView {
  id: string;
  scorePercent: number;
  comprehension: ComprehensionLevel;
  createdAt: string;
}

export interface QuizView {
  id: string;
  questions: PublicQuestion[];
  attempts: AttemptView[];
}

/** Everything the viewer renders. Used by the analysis page, the landing demo, public links and the print view. */
export interface AnalysisView {
  code: string;
  language: string;
  summary: Summary | null;
  blocks: Block[];
  diagrams: DiagramView[];
  concepts: ConceptView[];
  findings: FindingView[];
  quiz: QuizView | null;
}

export interface AnalysisDetail {
  id: string;
  title: string;
  level: Level;
  status: AnalysisStatus;
  errorMessage: string | null;
  createdAt: string;
  /** false until the audit ran (distinguishes "no findings" from "not audited yet"). */
  audited: boolean;
  shareToken: string | null;
  view: AnalysisView;
}

export interface AnalysisListItem {
  id: string;
  title: string;
  language: string;
  level: Level;
  status: AnalysisStatus;
  createdAt: string;
  codePreview: string;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  userAnswer: AnswerValue | null;
  correctAnswer: AnswerValue | null;
  explanation: string;
  lineStart: number | null;
  lineEnd: number | null;
  concept: string | null;
}

export interface ReviewItem {
  lineStart: number;
  lineEnd: number;
  concept: string | null;
}

export interface QuizResult {
  correctCount: number;
  total: number;
  /** 0 to 100, one decimal. */
  scorePercent: number;
  comprehension: ComprehensionLevel;
  results: QuestionResult[];
  review: ReviewItem[];
}

export interface ChatMessageView {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  lineStart: number | null;
  lineEnd: number | null;
  createdAt: string;
}

export interface QuotaView {
  used: number;
  limit: number;
  remaining: number;
}

export type MasteryStatus = "mastered" | "in_progress" | "needs_review";

export interface ConceptProgressView {
  name: string;
  masteryPercent: number;
  correctCount: number;
  total: number;
  status: MasteryStatus;
  fewAnswers: boolean;
  review: { analysisId: string; analysisTitle: string; lineStart: number | null; lineEnd: number | null } | null;
}

export interface ProgressView {
  totals: { analyses: number; completedAnalyses: number; attempts: number; quizzesAnswered: number; chatQuestions: number };
  averageScore: number | null;
  trend: number | null;
  streakDays: number;
  concepts: ConceptProgressView[];
  languages: { language: string; count: number }[];
  scoreHistory: { attemptedAt: string; scorePercent: number; analysisId: string; analysisTitle: string }[];
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  level: Level;
}

export interface GistFileView {
  name: string;
  language: string;
  content: string;
}

export type StageStatus = "running" | "done" | "failed";

/** One progress event of the Analyze stream, as the analysis screen consumes it. */
export type AnalysisEvent =
  | { type: "started"; analysisId: string }
  | { type: "stage"; stage: Stage; status: StageStatus; message: string | null }
  | { type: "finished"; analysisId: string; status: AnalysisStatus; message: string | null; fromCache: boolean };
