import { create } from "@bufbuild/protobuf";
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import {
  StageStatus as ProtoStageStatus,
  type AnalysisDetail as AnalysisDetailMessage,
  type AnalysisListItem as AnalysisListItemMessage,
  type AnalysisView as AnalysisViewMessage,
  type AnalyzeResponse,
} from "@/gen/vibedecoder/v1/analysis_pb";
import { ChatRole, type ChatMessage } from "@/gen/vibedecoder/v1/chat_pb";
import {
  AnalysisStatus as ProtoAnalysisStatus,
  ComprehensionLevel as ProtoComprehension,
  DiagramKind as ProtoDiagramKind,
  FindingKind as ProtoFindingKind,
  Level as ProtoLevel,
  LineRangeSchema,
  QuestionKind as ProtoQuestionKind,
  Severity as ProtoSeverity,
  Stage as ProtoStage,
  type LineRange as LineRangeMessage,
  type Quota,
} from "@/gen/vibedecoder/v1/common_pb";
import type { GetProgressResponse } from "@/gen/vibedecoder/v1/progress_pb";
import { MasteryStatus as ProtoMastery } from "@/gen/vibedecoder/v1/progress_pb";
import { AnswerValueSchema, OrderingSchema, type AnswerValue as AnswerValueMessage, type QuizResult as QuizResultMessage, type Quiz } from "@/gen/vibedecoder/v1/quiz_pb";
import type { User } from "@/gen/vibedecoder/v1/user_pb";
import {
  ANALYSIS_STATUSES,
  COMPREHENSION_LEVELS,
  DIAGRAM_KINDS,
  FINDING_KINDS,
  LEVELS,
  QUESTION_KINDS,
  SEVERITIES,
  type AnalysisDetail,
  type AnalysisEvent,
  type AnalysisListItem,
  type AnalysisView,
  type AnswerValue,
  type ChatMessageView,
  type LineRange,
  type Level,
  type MasteryStatus,
  type ProgressView,
  type QuizResult,
  type QuizView,
  type QuotaView,
  type Stage,
  type UserProfile,
} from "@/types/analysis-view";

/**
 * Anti-corruption layer between the API (protobuf messages: numeric enums, Timestamp, unset fields)
 * and the view models the components use (string unions, ISO dates, null).
 * Proto enum value names match the view-model names, so enums are mapped by name.
 */

type ProtoEnum = Record<string, string | number>;

function fromEnum<T extends string>(protoEnum: ProtoEnum, value: number, allowed: readonly T[], fallback: T): T {
  const name = protoEnum[value];
  return typeof name === "string" && (allowed as readonly string[]).includes(name) ? (name as T) : fallback;
}

function toEnum<E extends ProtoEnum>(protoEnum: E, name: string): E[keyof E] {
  const value = protoEnum[name.toUpperCase()];
  return (typeof value === "number" ? value : 0) as E[keyof E];
}

const iso = (t: Timestamp | undefined) => (t ? timestampDate(t).toISOString() : new Date(0).toISOString());
const start = (r: LineRangeMessage | undefined) => r?.start ?? null;
const end = (r: LineRangeMessage | undefined) => r?.end ?? null;

export const toProtoLevel = (level: Level): ProtoLevel => toEnum(ProtoLevel, level);
export const toProtoStage = (stage: Stage): ProtoStage => toEnum(ProtoStage, stage);
export const toProtoDiagramKind = (kind: string): ProtoDiagramKind => toEnum(ProtoDiagramKind, kind);
export const fromProtoLevel = (level: ProtoLevel): Level => fromEnum(ProtoLevel, level, LEVELS, "INTERMEDIATE");

export function fromProtoStage(stage: ProtoStage): Stage | null {
  const name = ProtoStage[stage];
  return typeof name === "string" && name !== "UNSPECIFIED" ? (name.toLowerCase() as Stage) : null;
}

export function toProtoRange(range: LineRange | null): LineRangeMessage | undefined {
  return range ? create(LineRangeSchema, { start: range.start, end: range.end }) : undefined;
}

export function toProtoAnswer(answer: AnswerValue | null): AnswerValueMessage | undefined {
  if (answer === null) return undefined;
  if (typeof answer === "boolean") return create(AnswerValueSchema, { value: { case: "boolean", value: answer } });
  if (Array.isArray(answer)) return create(AnswerValueSchema, { value: { case: "ordering", value: create(OrderingSchema, { positions: answer }) } });
  return create(AnswerValueSchema, { value: { case: "optionIndex", value: answer } });
}

export function fromProtoAnswer(answer: AnswerValueMessage | undefined): AnswerValue | null {
  switch (answer?.value.case) {
    case "boolean":
    case "optionIndex":
      return answer.value.value;
    case "ordering":
      return answer.value.value.positions;
    default:
      return null;
  }
}

export function fromProtoQuota(q: Quota | undefined): QuotaView | null {
  return q ? { used: q.used, limit: q.limit, remaining: q.remaining } : null;
}

function fromProtoQuiz(quiz: Quiz): QuizView {
  return {
    id: quiz.id,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      position: q.order,
      kind: fromEnum(ProtoQuestionKind, q.kind, QUESTION_KINDS, "MULTIPLE_CHOICE"),
      prompt: q.prompt,
      // TRUE_FALSE questions have no options; repeated fields are never "unset" in protobuf.
      options: q.options.length > 0 ? q.options : null,
      lineStart: start(q.range),
      lineEnd: end(q.range),
      concept: q.concept ?? null,
    })),
    attempts: quiz.attempts.map((a) => ({
      id: a.id,
      scorePercent: a.scorePercent,
      comprehension: fromEnum(ProtoComprehension, a.comprehension, COMPREHENSION_LEVELS, "INSUFFICIENT"),
      createdAt: iso(a.createdAt),
    })),
  };
}

export function fromProtoView(v: AnalysisViewMessage | undefined): AnalysisView {
  return {
    code: v?.code ?? "",
    language: v?.language ?? "plaintext",
    summary: v?.summary ? { purpose: v.summary.purpose, inputs: v.summary.inputs, outputs: v.summary.outputs, dependencies: v.summary.dependencies } : null,
    blocks: (v?.blocks ?? []).map((b) => ({ lineStart: b.range?.start ?? 1, lineEnd: b.range?.end ?? 1, title: b.title, explanation: b.explanation })),
    diagrams: (v?.diagrams ?? []).map((d) => ({ kind: fromEnum(ProtoDiagramKind, d.kind, DIAGRAM_KINDS, "FLOW"), title: d.title, mermaid: d.mermaid })),
    concepts: (v?.concepts ?? []).map((c) => ({ name: c.name, explanation: c.explanation, lineStart: start(c.range), lineEnd: end(c.range) })),
    findings: (v?.findings ?? []).map((f) => ({
      kind: fromEnum(ProtoFindingKind, f.kind, FINDING_KINDS, "BAD_PRACTICE"),
      severity: fromEnum(ProtoSeverity, f.severity, SEVERITIES, "LOW"),
      title: f.title,
      description: f.description,
      suggestion: f.suggestion,
      lineStart: start(f.range),
      lineEnd: end(f.range),
    })),
    quiz: v?.quiz ? fromProtoQuiz(v.quiz) : null,
  };
}

export function fromProtoAnalysis(a: AnalysisDetailMessage): AnalysisDetail {
  return {
    id: a.id,
    title: a.title,
    level: fromProtoLevel(a.level),
    status: fromEnum(ProtoAnalysisStatus, a.status, ANALYSIS_STATUSES, "PENDING"),
    errorMessage: a.errorMessage ?? null,
    createdAt: iso(a.createdAt),
    audited: a.audited,
    shareToken: a.shareToken ?? null,
    view: fromProtoView(a.view),
  };
}

export function fromProtoListItem(a: AnalysisListItemMessage): AnalysisListItem {
  return {
    id: a.id,
    title: a.title,
    language: a.language,
    level: fromProtoLevel(a.level),
    status: fromEnum(ProtoAnalysisStatus, a.status, ANALYSIS_STATUSES, "PENDING"),
    createdAt: iso(a.createdAt),
    codePreview: a.codePreview,
  };
}

export function fromProtoQuizResult(r: QuizResultMessage): QuizResult {
  return {
    correctCount: r.correctCount,
    total: r.total,
    scorePercent: r.scorePercent,
    comprehension: fromEnum(ProtoComprehension, r.comprehension, COMPREHENSION_LEVELS, "INSUFFICIENT"),
    results: r.results.map((q) => ({
      questionId: q.questionId,
      correct: q.correct,
      userAnswer: fromProtoAnswer(q.userAnswer),
      correctAnswer: fromProtoAnswer(q.correctAnswer),
      explanation: q.explanation,
      lineStart: start(q.range),
      lineEnd: end(q.range),
      concept: q.concept ?? null,
    })),
    review: r.review.map((item) => ({ lineStart: item.range?.start ?? 1, lineEnd: item.range?.end ?? item.range?.start ?? 1, concept: item.concept ?? null })),
  };
}

const STAGE_STATUS: Record<ProtoStageStatus, "running" | "done" | "failed" | null> = {
  [ProtoStageStatus.UNSPECIFIED]: null,
  [ProtoStageStatus.RUNNING]: "running",
  [ProtoStageStatus.DONE]: "done",
  [ProtoStageStatus.FAILED]: "failed",
};

/** One stream message → view event; null for events this client does not understand (newer backend). */
export function fromProtoAnalyzeResponse(r: AnalyzeResponse): AnalysisEvent | null {
  switch (r.event.case) {
    case "started":
      return { type: "started", analysisId: r.event.value.analysisId };
    case "stage": {
      const stage = fromProtoStage(r.event.value.stage);
      const status = STAGE_STATUS[r.event.value.status];
      return stage && status ? { type: "stage", stage, status, message: r.event.value.message ?? null } : null;
    }
    case "finished":
      return {
        type: "finished",
        analysisId: r.event.value.analysisId,
        status: fromEnum(ProtoAnalysisStatus, r.event.value.status, ANALYSIS_STATUSES, "FAILED"),
        message: r.event.value.message ?? null,
        fromCache: r.event.value.fromCache,
      };
    default:
      return null;
  }
}

export function fromProtoChatMessage(m: ChatMessage): ChatMessageView {
  return {
    id: m.id,
    role: m.role === ChatRole.USER ? "USER" : "ASSISTANT",
    content: m.content,
    lineStart: start(m.range),
    lineEnd: end(m.range),
    createdAt: iso(m.createdAt),
  };
}

const MASTERY: Record<ProtoMastery, MasteryStatus> = {
  [ProtoMastery.UNSPECIFIED]: "needs_review",
  [ProtoMastery.MASTERED]: "mastered",
  [ProtoMastery.IN_PROGRESS]: "in_progress",
  [ProtoMastery.NEEDS_REVIEW]: "needs_review",
};

export function fromProtoProgress(p: GetProgressResponse): ProgressView {
  return {
    totals: {
      analyses: p.totals?.analyses ?? 0,
      completedAnalyses: p.totals?.completedAnalyses ?? 0,
      attempts: p.totals?.attempts ?? 0,
      quizzesAnswered: p.totals?.quizzesAnswered ?? 0,
      chatQuestions: p.totals?.chatQuestions ?? 0,
    },
    averageScore: p.averageScore ?? null,
    trend: p.trend ?? null,
    streakDays: p.streakDays,
    concepts: p.concepts.map((c) => ({
      name: c.name,
      masteryPercent: c.masteryPercent,
      correctCount: c.correctCount,
      total: c.total,
      status: MASTERY[c.status],
      fewAnswers: c.fewAnswers,
      review: c.review ? { analysisId: c.review.analysisId, analysisTitle: c.review.analysisTitle, lineStart: start(c.review.range), lineEnd: end(c.review.range) } : null,
    })),
    languages: p.languages.map((l) => ({ language: l.language, count: l.count })),
    scoreHistory: p.scoreHistory.map((s) => ({ attemptedAt: iso(s.attemptedAt), scorePercent: s.scorePercent, analysisId: s.analysisId, analysisTitle: s.analysisTitle })),
  };
}

export function fromProtoUser(u: User): UserProfile {
  return { id: u.id, name: u.name ?? null, email: u.email, imageUrl: u.imageUrl ?? null, level: fromProtoLevel(u.level) };
}
