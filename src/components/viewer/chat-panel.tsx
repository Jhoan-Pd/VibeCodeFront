"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Send, Sparkles, Trash2, X } from "lucide-react";
import { ChatText } from "@/components/chat-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { fromProtoChatMessage, toProtoRange } from "@/lib/rpc/mappers";
import { cn } from "@/lib/utils";
import type { LineSpan } from "@/lib/viewer";
import type { ChatMessageView } from "@/types/analysis-view";
import { LineRangeButton, lineRangeLabel, type GoToLines } from "./line-range-button";

const t = messages.viewer.chat;

/** Same limit as the backend (schemas/chat.ts); the backend validates it again. */
export const MAX_CHAT_MESSAGE = 1000;

export interface ChatPanelProps {
  /** Without analysisId (the demo) an invitation to sign up is shown. */
  analysisId?: string;
  initialMessages: ChatMessageView[];
  selection: LineSpan | null;
  clearSelection: () => void;
  goToLines: GoToLines;
}

/** Contextual chat: follow-up questions about the lines selected in the editor. */
export function ChatPanel({ analysisId, initialMessages, selection, clearSelection, goToLines }: ChatPanelProps) {
  const [chat, setChat] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The send icon (a paper plane) flies away while the question is sent. */
  const [flights, setFlights] = useState(0);
  const [flying, setFlying] = useState(false);
  /** Messages already there when the chat opened: only new answers animate part by part. */
  const initialIds = useRef(new Set(initialMessages.map((m) => m.id)));
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [chat, sending]);

  if (!analysisId) {
    return (
      <Card className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageSquareText className="size-8 text-primary" />
        <p className="font-medium">{t.signUpTitle}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{t.signUpBody}</p>
        <Button asChild size="sm">
          <Link href="/register">{t.signUpAction}</Link>
        </Button>
      </Card>
    );
  }
  const id = analysisId;

  async function send(question: string) {
    const message = question.trim();
    if (message.length < 2 || sending) return;
    setSending(true);
    setFlights((n) => n + 1);
    setFlying(true);
    setTimeout(() => setFlying(false), 700);
    setError(null);
    const r = await attempt(() => rpc.chat.sendMessage({ analysisId: id, message, range: toProtoRange(selection) }));
    setSending(false);
    if (!r.ok) {
      setError(r.error || t.failed);
      return;
    }
    setChat((prev) => [...prev, ...r.data.messages.map(fromProtoChatMessage)]);
    setText("");
  }

  async function clear() {
    const r = await attempt(() => rpc.chat.clearConversation({ analysisId: id }));
    if (r.ok) setChat([]);
    else setError(r.error || t.clearFailed);
  }

  return (
    <Card className="flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MessageSquareText className="size-4 text-primary" /> {t.title}
        </p>
        {chat.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} aria-label={t.clearLabel}>
            <Trash2 /> {t.clear}
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {chat.length === 0 && !sending && (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t.empty}</p>
            <div className="flex flex-wrap gap-2">
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/60 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={cn("vd-pop flex", m.role === "USER" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[90%] space-y-2 rounded-lg px-3 py-2 text-sm leading-relaxed", m.role === "USER" ? "bg-primary/15" : "border bg-background/60")}>
              {m.role === "USER" && m.lineStart != null && <LineRangeButton start={m.lineStart} end={m.lineEnd} goToLines={goToLines} />}
              {m.role === "USER" ? <p className="whitespace-pre-wrap">{m.content}</p> : <ChatText text={m.content} animate={!initialIds.current.has(m.id)} />}
            </div>
          </div>
        ))}
        {sending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> {t.thinking}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <Alert variant="error" className="mx-4 mb-2">
          {error}
        </Alert>
      )}

      <form
        className="space-y-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          {selection ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">
              {t.about(lineRangeLabel(selection.start, selection.end))}
              <button type="button" onClick={clearSelection} aria-label={t.clearSelection} className="hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ) : (
            <span>{t.noSelection}</span>
          )}
        </div>
        <div className="flex gap-2">
          <label htmlFor="chat-message" className="sr-only">
            {t.inputLabel}
          </label>
          <textarea
            id="chat-message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(text);
              }
            }}
            maxLength={MAX_CHAT_MESSAGE}
            rows={2}
            placeholder={t.placeholder}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={sending || text.trim().length < 2} aria-label={t.send}>
            {sending && !flying ? <Spinner /> : <Send key={flights} className={flights > 0 ? "vd-send-fly" : undefined} />}
          </Button>
        </div>
      </form>
    </Card>
  );
}
