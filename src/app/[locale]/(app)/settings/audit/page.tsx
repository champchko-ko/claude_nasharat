import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { assertCanViewAudit } from "@/lib/audit/assertCanViewAudit";
import { getSchoolAuditLogs, type AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";
import { AuditLogList } from "@/components/settings/AuditLogList";

type AuditPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    action?: string;
    entityType?: string;
    actorLabel?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
};

export default async function AuditSettingsPage({ params, searchParams }: AuditPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  const authCheck = await assertCanViewAudit();
  if (!authCheck.authorized) {
    redirect({ href: "/settings", locale });
    return null;
  }

  const sp = searchParams ? await searchParams : {};
  const page = sp.page ? parseInt(sp.page, 10) : 1;

  const filters: AuditLogFilters = {
    action: sp.action || undefined,
    entityType: sp.entityType || undefined,
    actorLabel: sp.actorLabel || undefined,
    startDate: sp.startDate || undefined,
    endDate: sp.endDate || undefined,
    page: isNaN(page) ? 1 : page,
    pageSize: 50,
  };

  const result = await getSchoolAuditLogs(authCheck.schoolId, filters).catch(() => ({
    logs: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("audit")}</h2>
        <p className="text-sm text-muted-foreground">{t("auditDesc")}</p>
      </div>

      <AuditLogList result={result} filters={filters} />
    </div>
  );
}
