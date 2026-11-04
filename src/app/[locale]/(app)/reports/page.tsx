import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n";
import { assertCanViewReports } from "@/lib/reports/assertCanViewReports";
import { getCircularsReportData } from "@/lib/reports/getCircularsReportData";
import { getMaintenanceReportData } from "@/lib/reports/getMaintenanceReportData";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { ReportsHub } from "@/components/reports";
import { PageHeader } from "@/components/ui/page-header";

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const authCheck = await assertCanViewReports();
  if (!authCheck.authorized) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const t = await getTranslations("reports");
  const [circularsData, maintenanceData, departments] = await Promise.all([
    getCircularsReportData(authCheck.schoolId, {}, authCheck.scopedDepartmentId),
    getMaintenanceReportData(
      authCheck.schoolId,
      authCheck.scopedDepartmentId ? { departmentId: authCheck.scopedDepartmentId } : {},
    ),
    getSchoolDepartments(authCheck.schoolId),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <ReportsHub
        circularsData={circularsData}
        maintenanceData={maintenanceData}
        departments={departments}
      />
    </div>
  );
}
