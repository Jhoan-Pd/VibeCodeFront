import { Bug, GitBranch, GraduationCap, Layers, MessageCircleQuestion, MousePointerClick, Share2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { DemoViewer } from "@/components/demo-viewer";
import { LandingCta } from "@/components/landing-cta";
import { RotatingWord } from "@/components/motion/rotating-word";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { messages } from "@/i18n";
import { staggerDelay } from "@/lib/motion";

const t = messages.landing;

/**
 * Landing page: STATIC (SSG). It reads no session, cookies nor backend data; the demo is pre-computed
 * and the session-dependent call to action is a client island. Served from the CDN as plain HTML.
 */
export const dynamic = "force-static";

const FEATURES = [
  { icon: MousePointerClick, ...t.features.items.synced },
  { icon: GitBranch, ...t.features.items.diagrams },
  { icon: Layers, ...t.features.items.levels },
  { icon: Bug, ...t.features.items.audit },
  { icon: GraduationCap, ...t.features.items.quiz },
  { icon: MessageCircleQuestion, ...t.features.items.chat },
  { icon: TrendingUp, ...t.features.items.progress },
  { icon: Share2, ...t.features.items.share },
  { icon: ShieldCheck, ...t.features.items.safe },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero: enters line by line (rises 32 px and fades in), staggered every 75 ms. */}
      <section className="overflow-x-clip">
        <div className="container flex flex-col items-center gap-7 py-20 text-center md:py-28">
          <Badge variant="default" className="vd-enter gap-1.5" style={staggerDelay(0, 75)}>
            <Sparkles className="size-3" /> {t.badge}
          </Badge>
          <h1 className="vd-title max-w-4xl text-[clamp(1.75rem,8.6vw,3rem)] leading-[1.02] sm:text-6xl sm:leading-[0.95] lg:text-[5.25rem]">
            <span className="vd-enter block" style={staggerDelay(1, 75)}>
              {t.titleStart} <RotatingWord words={[...t.titleWords]} /> {t.titleEnd}
            </span>
            <span className="vd-enter block text-primary" style={staggerDelay(2, 75)}>
              {t.titleSecondLine}
            </span>
          </h1>
          <p className="vd-enter max-w-2xl text-lg text-muted-foreground" style={staggerDelay(3, 75)}>
            {t.lead}
          </p>
          <div className="vd-enter" style={staggerDelay(4, 75)}>
            <LandingCta withSecondary />
          </div>
        </div>
      </section>

      <section id="demo" className="container scroll-mt-20 space-y-5 pb-4">
        <div className="space-y-2" data-reveal>
          <h2 className="vd-title text-3xl sm:text-4xl">{t.demo.title}</h2>
          <p className="text-sm text-muted-foreground">{t.demo.body}</p>
        </div>
        <div data-reveal style={staggerDelay(1)}>
          <DemoViewer />
        </div>
      </section>

      <section className="container space-y-10 pt-24">
        <h2 className="vd-title text-center text-3xl sm:text-5xl" data-reveal>
          {t.howItWorks.title}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.howItWorks.steps.map((step, i) => (
            <Card key={step.n} data-reveal style={staggerDelay(i)}>
              <CardContent className="space-y-2 p-6">
                <span className="font-mono text-sm text-primary">{step.n}</span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container space-y-10 pt-24">
        <h2 className="vd-title text-center text-3xl sm:text-5xl" data-reveal>
          {t.features.title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="flex gap-3 rounded-lg border border-border/70 bg-card p-5 shadow-card" data-reveal style={staggerDelay(i % 3)}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.icon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pt-24">
        <Card className="border-primary/10 bg-gradient-to-b from-primary/[0.06] to-primary/[0.12]" data-reveal>
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center sm:p-14">
            <h2 className="vd-title text-3xl sm:text-4xl">{t.finalCta}</h2>
            <LandingCta />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
