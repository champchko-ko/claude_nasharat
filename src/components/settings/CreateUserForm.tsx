"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createUserAction } from "@/actions/settings/createUserAction";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { UserRoleSelect } from "./UserRoleSelect";
import { CreateUserPasswordInput } from "./CreateUserPasswordInput";
import { CreateUserDeptSelect } from "./CreateUserDeptSelect";
import { CreateUserBasicFields } from "./CreateUserBasicFields";

export function CreateUserForm({
  departments,
  roles,
  onClose,
}: {
  departments: DepartmentRow[];
  roles: SchoolRoleRow[];
  onClose: () => void;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleKey, setRoleKey] = useState("staff");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction({
        fullName,
        email,
        password,
        jobTitle,
        departmentId: departmentId || null,
        roleKey,
      });
      if (res.success) {
        toast.success(t("userCreated"));
        onClose();
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <CreateUserBasicFields
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        setEmail={setEmail}
        jobTitle={jobTitle}
        setJobTitle={setJobTitle}
        disabled={isPending}
      />

      <CreateUserPasswordInput password={password} setPassword={setPassword} disabled={isPending} />

      <CreateUserDeptSelect
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        departments={departments}
        disabled={isPending}
      />

      <UserRoleSelect
        roleKey={roleKey}
        setRoleKey={setRoleKey}
        roles={roles}
        disabled={isPending}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
