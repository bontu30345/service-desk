"use client";

import { FormDialog } from "./form-dialog";
import { CreateUserForm } from "@/features/users/components/create-user-form";
import { CreateDepartmentForm } from "@/features/departments/components/create-department-form";
import { CreateCategoryForm } from "@/features/categories/components/create-category-form";
import { CreateSLAPolicyForm } from "@/features/sla/components/create-sla-policy-form";

type Resource = "user" | "department" | "category" | "sla";

const labels: Record<Resource, { title: string; trigger: string }> = {
  user: { title: "Add user", trigger: "Add User" },
  department: { title: "Add department", trigger: "Add Department" },
  category: { title: "Add category", trigger: "Add Category" },
  sla: { title: "Add SLA policy", trigger: "Add SLA" },
};

export function ManagementCreateDialog({
  resource,
  departments = [],
}: {
  resource: Resource;
  departments?: { id: number; name: string }[];
}) {
  const label = labels[resource];

  return (
    <FormDialog title={label.title} triggerLabel={label.trigger}>
      {(close) => {
        switch (resource) {
          case "user":
            return <CreateUserForm departments={departments} onSuccess={close} />;
          case "department":
            return <CreateDepartmentForm onSuccess={close} />;
          case "category":
            return <CreateCategoryForm onSuccess={close} />;
          case "sla":
            return <CreateSLAPolicyForm onSuccess={close} />;
        }
      }}
    </FormDialog>
  );
}
