"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LevelSelector } from "@/components/level-selector";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert, Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { toProtoLevel } from "@/lib/rpc/mappers";
import type { Level } from "@/types/analysis-view";

const t = messages.profile;

export function ProfileForm({ initialName, initialLevel, email }: { initialName: string; initialLevel: Level; email: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState(initialLevel);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const trimmed = name.trim();
    const r = await attempt(() => rpc.user.updateProfile({ level: toProtoLevel(level), name: trimmed.length >= 2 ? trimmed : undefined }));
    setLoading(false);
    if (!r.ok) {
      setNotice({ variant: "error", text: r.error || t.failed });
      return;
    }
    setNotice({ variant: "success", text: t.saved });
    // The navbar shows the name from the session: refresh it, then the server components.
    await update();
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}
      <div className="space-y-2">
        <Label htmlFor="email">{messages.auth.fields.email}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t.name}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label>{t.level}</Label>
        <p className="text-xs text-muted-foreground">{t.levelHint}</p>
        <LevelSelector value={level} onChange={setLevel} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Spinner />} {t.submit}
      </Button>
    </form>
  );
}
