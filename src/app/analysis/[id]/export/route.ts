import { NextResponse } from "next/server";
import { messages } from "@/i18n";
import { fileName, toMarkdown } from "@/lib/markdown-export";
import { getAnalysis } from "@/lib/rpc/queries";
import { NoSessionError } from "@/lib/rpc/server";
import { publicUrl } from "@/lib/share";

export const dynamic = "force-dynamic";

/** GET /analysis/:id/export — downloads the whole analysis as Markdown (.md), built from GetAnalysis. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let analysis;
  try {
    analysis = await getAnalysis(id);
  } catch (e) {
    if (e instanceof NoSessionError) return NextResponse.json({ error: messages.errors.sessionExpired }, { status: 401 });
    throw e;
  }
  if (!analysis) return NextResponse.json({ error: messages.errors.notFound }, { status: 404 });

  const markdown = toMarkdown(analysis.view, {
    title: analysis.title,
    level: analysis.level,
    createdAt: new Date(analysis.createdAt),
    link: analysis.shareToken ? publicUrl(new URL(req.url).origin, analysis.shareToken) : null,
  });
  const name = fileName(analysis.title, "md");

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // filename* in UTF-8 for browsers that use it; a plain ASCII filename as the fallback.
      "content-disposition": `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
