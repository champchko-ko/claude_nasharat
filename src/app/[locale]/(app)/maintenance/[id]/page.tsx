import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getMaintenanceRequestById } from "@/lib/maintenance/getMaintenanceRequestById";
import { getMaintenanceUpdates } from "@/lib/maintenance/getMaintenanceUpdates";
import { getMaintenanceAttachments } from "@/lib/maintenance/getMaintenanceAttachments";
import { getMaintenanceOperators } from "@/lib/maintenance/getMaintenanceOperators";
import { MaintenanceDetailCard } from "@/components/maintenance/MaintenanceDetailCard";
import { MaintenanceAttachmentsList } from "@/components/maintenance/MaintenanceAttachmentsList";
import { MaintenanceStatusActions } from "@/components/maintenance/MaintenanceStatusActions";
import { MaintenanceAssignSection } from "@/components/maintenance/MaintenanceAssignSection";
import { MaintenanceTimeline } from "@/components/maintenance/MaintenanceTimeline";
import { MaintenanceAddNoteBox } from "@/components/maintenance/MaintenanceAddNoteBox";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  const ticket = await getMaintenanceRequestById(id);
  if (!ticket) {
    notFound();
  }

  const [updates, attachments, operators, canAssign, canClose] = await Promise.all([
    getMaintenanceUpdates(id),
    getMaintenanceAttachments(id),
    getMaintenanceOperators("singleton"),
    hasPermission("maintenance.assign", undefined, profile.department_id).catch(() => false),
    hasPermission("maintenance.close", undefined, profile.department_id).catch(() => false),
  ]);

  const isReporter = ticket.reporter_id === profile.id;
  const isOperator = ticket.assigned_operator_id === profile.id;
  const isParticipant = isReporter || isOperator || canAssign;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <Link href={`/${locale}/maintenance`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeftIcon className="size-4 rtl:rotate-180" />
            <span>Back to Maintenance</span>
          </Button>
        </Link>
      </div>

      <MaintenanceDetailCard ticket={ticket} />

      <MaintenanceAttachmentsList attachments={attachments} />

      <MaintenanceStatusActions
        requestId={id}
        status={ticket.status}
        isReporter={isReporter}
        isOperator={isOperator}
        canAssign={canAssign}
        canClose={canClose}
      />

      {canAssign && (
        <MaintenanceAssignSection
          requestId={id}
          currentOperatorId={ticket.assigned_operator_id}
          currentPriority={ticket.priority}
          currentStatus={ticket.status}
          operators={operators}
        />
      )}

      <MaintenanceTimeline updates={updates} />

      {isParticipant && <MaintenanceAddNoteBox requestId={id} />}
    </div>
  );
}
