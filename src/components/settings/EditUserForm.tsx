"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { EditUserBasicFields } from "./EditUserBasicFields";
import { EditUserSecurityFields } from "./EditUserSecurityFields";
import { EditUserDeptSelect } from "./EditUserDeptSelect";
import { UserRoleSelect } from "./UserRoleSelect";
import { useEditUserSubmit } from "./useEditUserSubmit";

export function EditUserForm({
  user,
  departments,
  roles = [],
  onClose,
}: {
  user: SchoolUserRow;
  departments: DepartmentRow[];
  roles?: SchoolRoleRow[];
  onClose: () => void;
}) {
  const tCommon = useTranslations("common");
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState(user.job_title ?? "");
  const [departmentId, setDepartmentId] = useState(user.department_id ?? "");
  const [roleKey, setRoleKey] = useState(user.role_key ?? "staff");
  const [isActive, setIsActive] = useState(user.is_active);
  const { isPending, submit } = useEditUserSubmit(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({
      userId: user.id,
      fullName,
      email: email || null,
      phone: phone || null,
      password: password || null,
      jobTitle: jobTitle || null,
      departmentId: departmentId || null,
      roleKey: roleKey || null,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <EditUserBasicFields
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        jobTitle={jobTitle}
        setJobTitle={setJobTitle}
        disabled={isPending}
      />
      <EditUserSecurityFields
        password={password}
        setPassword={setPassword}
        isActive={isActive}
        setIsActive={setIsActive}
        disabled={isPending}
      />
      <EditUserDeptSelect
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
