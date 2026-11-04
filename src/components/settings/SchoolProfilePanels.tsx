import { useTranslations } from "next-intl";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import type { SchoolProfileTabId } from "./schoolProfileTabTypes";
import { SchoolIdentityFields } from "./SchoolIdentityFields";
import { SchoolLeadershipFields } from "./SchoolLeadershipFields";
import { SchoolContactFields } from "./SchoolContactFields";
import { SchoolLogoFields } from "./SchoolLogoFields";
import { SchoolNarrativeFields } from "./SchoolNarrativeFields";
import { SchoolOperationFields } from "./SchoolOperationFields";

export function SchoolProfilePanels({
  activeTab,
  school,
  canManage,
}: {
  activeTab: SchoolProfileTabId;
  school: SchoolFullDetails;
  canManage: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <div id="panel-identity" className={activeTab === "identity" ? "block space-y-4" : "hidden"}>
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("identity")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SchoolIdentityFields school={school} canManage={canManage} />
        </div>
      </div>

      <div
        id="panel-leadership"
        className={activeTab === "leadership" ? "block space-y-4" : "hidden"}
      >
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("leadership")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SchoolLeadershipFields school={school} canManage={canManage} />
        </div>
      </div>

      <div id="panel-contact" className={activeTab === "contact" ? "block space-y-4" : "hidden"}>
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("contactAndLocation")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SchoolContactFields school={school} canManage={canManage} />
        </div>
      </div>

      <div id="panel-logo" className={activeTab === "logo" ? "block space-y-4" : "hidden"}>
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("logo")}</h3>
        </div>
        <SchoolLogoFields logoPath={school.logo_path} canManage={canManage} />
      </div>

      <div
        id="panel-operations"
        className={activeTab === "operations" ? "block space-y-4" : "hidden"}
      >
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("operationalSettings")}</h3>
        </div>
        <SchoolOperationFields
          workingDays={school.working_days}
          dateFormat={school.date_format}
          canManage={canManage}
        />
      </div>

      <div
        id="panel-narrative"
        className={activeTab === "narrative" ? "block space-y-4" : "hidden"}
      >
        <div className="border-b border-border/70 pb-2">
          <h3 className="text-base font-bold text-foreground">{t("visionAndMission")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SchoolNarrativeFields
            visionAr={school.vision_ar || school.vision}
            visionEn={school.vision_en}
            missionAr={school.mission_ar || school.mission}
            missionEn={school.mission_en}
            disabled={!canManage}
          />
        </div>
      </div>
    </div>
  );
}
