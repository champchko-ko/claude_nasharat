import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { resolveLayoutNavigationAccess } from "@/lib/auth/resolveLayoutNavigationAccess";
import { getSchoolDocumentsBySlug } from "@/lib/documents/getSchoolDocumentsBySlug";
import { SchoolDocumentsManager } from "@/components/documents/SchoolDocumentsManager";
import type { SchoolDocumentSlug } from "@/lib/documents/types";

const VALID_SLUGS = ["operational-plan", "committees-guide", "counseling-guide"] as const;
type DocumentSlug = (typeof VALID_SLUGS)[number];

export default async function SchoolDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!VALID_SLUGS.includes(slug as DocumentSlug)) {
    notFound();
  }

  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    redirect({ href: "/login", locale });
    return null;
  }

  const schoolId = await resolveSchoolForCaller(profile);
  const [isOwner, permissions] = await Promise.all([
    isPlatformOwner(profile.id),
    getEffectivePermissions(schoolId).catch(() => []),
  ]);

  const { canViewDocuments } = resolveLayoutNavigationAccess(
    isOwner,
    permissions,
    true,
  );

  if (!canViewDocuments) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const [tHome, documents] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getSchoolDocumentsBySlug(schoolId, slug as SchoolDocumentSlug),
  ]);

  const documentConfig = {
    "operational-plan": {
      title: tHome("docOperationalPlanTitle"),
      description: tHome("docOperationalPlanDesc"),
    },
    "committees-guide": {
      title: tHome("docCommitteesGuideTitle"),
      description: tHome("docCommitteesGuideDesc"),
    },
    "counseling-guide": {
      title: tHome("docCounselingGuideTitle"),
      description: tHome("docCounselingGuideDesc"),
    },
  }[slug as DocumentSlug];

  return (
    <SchoolDocumentsManager
      slug={slug as SchoolDocumentSlug}
      title={documentConfig.title}
      description={documentConfig.description}
      documents={documents}
    />
  );
}
