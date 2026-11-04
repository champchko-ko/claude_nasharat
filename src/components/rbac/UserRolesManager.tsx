"use client";

import { useState } from "react";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { UserList } from "@/components/settings/UserList";
import { RoleList } from "./RoleList";
import { UserRolesTabNav } from "./UserRolesTabNav";

export function UserRolesManager({
  users,
  departments,
  roles,
  currentUserId,
  canManageUsers,
  canManageRoles,
}: {
  users: SchoolUserRow[];
  departments: DepartmentRow[];
  roles: SchoolRoleRow[];
  currentUserId?: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
}) {
  // A roles-only user lands on the Roles tab; a users-only user never sees it.
  const [activeTab, setActiveTab] = useState<"users" | "roles">(canManageUsers ? "users" : "roles");

  return (
    <div className="space-y-6">
      <UserRolesTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showUsers={canManageUsers}
        showRoles={canManageRoles}
      />
      {activeTab === "users" && canManageUsers ? (
        <UserList
          users={users}
          departments={departments}
          roles={roles}
          currentUserId={currentUserId}
          canManage={canManageUsers}
        />
      ) : canManageRoles ? (
        <RoleList roles={roles} canManage={canManageRoles} />
      ) : null}
    </div>
  );
}
