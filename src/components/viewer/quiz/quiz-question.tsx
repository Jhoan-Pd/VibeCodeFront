"use client";

import { ArrowDown, ArrowUp, CheckCircle2, XCircle } from "lucide-react";
import { InlineCodeText } from "@/components/inline-code-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { messages } from "@/i18n";
import { describeAnswer, moveStep, optionLetter, optionState, type OptionState } from "@/lib/quiz-ui";
import { cn } from "@/lib/utils";
import type { AnswerValue, PublicQuestion, QuestionResult } from "@/types/analysis-view";
import { LineRangeButton, lineRangeLabel, type GoToLines } from "../line-range-button";

const t = messages.viewer.quiz;

/** One quiz question: prompt, controls by kind and, once graded, the explanation. */
export function QuizQuestion({
  number,
  question: q,
  answer,
  result,
  onAnswer,
  goToLines,
}: {
  number: number;
  question: PublicQuestion;
  answer: AnswerValue | null;
  result?: QuestionResult;
  onAnswer: (v: AnswerValue) => void;
  goToLines: GoToLines;
}) {
  const locked = !!result;
  const options = q.options ?? [];

  return (
    <Card className={cn(result && (result.correct ? "border-emerald-500/40" : "border-destructive/40"))}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {number}. {messages.labels.questionKind[q.kind]}
            {q.concept ? ` · ${q.concept}` : ""}
          </p>
          <LineRangeButton start={q.lineStart} end={q.lineEnd} goToLines={goToLines} />
        </div>
        <p className="text-sm font-medium leading-relaxed">
          <InlineCodeText text={q.prompt} />
        </p>

        {q.kind === "TRUE_FALSE" ? (
          <div className="flex gap-2" role="radiogroup" aria-label={t.answerGroup(number)}>
            {[true, false].map((v) => (
              <OptionButton key={String(v)} selected={answer === v} state={optionState(result, v, answer === v)} disabled={locked} onClick={() => onAnswer(v)}>
                {v ? messages.labels.trueFalse.true : messages.labels.trueFalse.false}
              </OptionButton>
            ))}
          </div>
        ) : q.kind === "ORDERING" ? (
          <SortableList steps={options} order={Array.isArray(answer) ? answer : options.map((_, i) => i)} onChange={onAnswer} disabled={locked} />
        ) : (
          <div className="grid gap-2" role="radiogroup" aria-label={t.answerGroup(number)}>
            {options.map((text, i) => (
              <OptionButton key={i} selected={answer === i} state={optionState(result, i, answer === i)} disabled={locked} onClick={() => onAnswer(i)}>
                <span className="mr-2 font-mono text-xs text-muted-foreground">{optionLetter(i)}.</span>
                <InlineCodeText text={text} />
              </OptionButton>
            ))}
          </div>
        )}

        {result && (
          <div className={cn("flex gap-2 rounded-md p-3 text-sm", result.correct ? "bg-emerald-500/10" : "bg-destructive/10")}>
            {result.correct ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
            <div className="space-y-1">
              <p className="font-medium">
                {result.correct ? t.correct : result.correctAnswer !== null && <InlineCodeText text={t.wrong(describeAnswer(q, result.correctAnswer))} />}
              </p>
              <p className="text-muted-foreground">
                <InlineCodeText text={result.explanation} />
              </p>
              {!result.correct && result.lineStart != null && <p className="text-xs text-muted-foreground">{t.reviewLines(lineRangeLabel(result.lineStart, result.lineEnd))}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OptionButton({ children, selected, state, disabled, onClick }: { children: React.ReactNode; selected: boolean; state: OptionState; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
        selected && state === "neutral" && "border-primary bg-primary/10",
        !selected && state === "neutral" && "hover:border-primary/50 disabled:hover:border-border",
        state === "correct" && "border-emerald-500 bg-emerald-500/10",
        state === "wrong" && "border-destructive bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}

/** List reordered with buttons (keyboard accessible, works on phones without dragging). */
function SortableList({ steps, order, onChange, disabled }: { steps: string[]; order: number[]; onChange: (v: number[]) => void; disabled: boolean }) {
  const move = (position: number, delta: -1 | 1) => onChange([...moveStep(order, position, delta)]);
  return (
    <ol className="space-y-2">
      {order.map((index, position) => (
        <li key={index} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="w-5 font-mono text-xs text-muted-foreground">{position + 1}.</span>
          <span className="flex-1">
            <InlineCodeText text={steps[index] ?? ""} />
          </span>
          {!disabled && (
            <span className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(position, -1)} disabled={position === 0} aria-label={t.moveUp}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(position, 1)} disabled={position === order.length - 1} aria-label={t.moveDown}>
                <ArrowDown className="size-3.5" />
              </Button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
