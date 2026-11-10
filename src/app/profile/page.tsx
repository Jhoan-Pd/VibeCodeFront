import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n";
import { getProfile } from "@/lib/rpc/queries";

const t = messages.profile;

export const metadata: Metadata = { title: t.metaTitle };

/** Profile: SSR (private). The form is a Client Component that saves through UpdateProfile. */
export default async function ProfilePage() {
  const user = await getProfile();
  if (!user) redirect("/login");

  return (
    <div className="container max-w-xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name ?? ""} initialLevel={user.level} email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
