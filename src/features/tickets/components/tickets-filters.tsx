"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Priority, TicketStatus } from "@prisma/client";
import type { TicketListFilters, TicketQueue, TicketRelationOption } from "../types/ticket";

type FilterValues = {
  search: string;
  status: string;
  priority: string;
  departmentId: string;
  categoryId: string;
  assigneeId: string;
};

type FilterName = keyof FilterValues;

const filterNames: FilterName[] = [
  "search",
  "status",
  "priority",
  "departmentId",
  "categoryId",
  "assigneeId",
];

const controlClassName =
  "min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

function valuesFromFilters(filters: TicketListFilters): FilterValues {
  return {
    search: filters.search ?? "",
    status: filters.status ?? "",
    priority: filters.priority ?? "",
    departmentId: filters.departmentId?.toString() ?? "",
    categoryId: filters.categoryId?.toString() ?? "",
    assigneeId: filters.assigneeId?.toString() ?? "",
  };
}

function writeValuesToParams(params: URLSearchParams, values: FilterValues) {
  for (const name of filterNames) {
    if (values[name]) params.set(name, values[name]);
    else params.delete(name);
  }
  params.delete("page");
}

export function TicketsFilters(props: {
  filters: TicketListFilters;
  departments: TicketRelationOption[];
  categories: TicketRelationOption[];
  assignees: TicketRelationOption[];
  queue: TicketQueue;
  userRole: string; // Added userRole prop
}) {
  const searchParams = useSearchParams();
  return <TicketFilterControls key={searchParams.toString()} {...props} />;
}

function TicketFilterControls({
  filters,
  departments,
  categories,
  assignees,
  queue,
  userRole,
}: {
  filters: TicketListFilters;
  departments: TicketRelationOption[];
  categories: TicketRelationOption[];
  assignees: TicketRelationOption[];
  queue: TicketQueue;
  userRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState(() => valuesFromFilters(filters));
  const [selectedQueue, setSelectedQueue] = useState<TicketQueue>(queue);
  const valuesRef = useRef(valuesFromFilters(filters));
  const queueRef = useRef(queue);

  const navigateWithFilters = useCallback(
    (nextValues: FilterValues, nextQueue: TicketQueue, replace: boolean) => {
      const params = new URLSearchParams(paramsKey);
      writeValuesToParams(params, nextValues);
      if (nextQueue === "assigned") params.set("queue", "assigned");
      else params.delete("queue");

      const query = params.toString();
      const href = query ? `/tickets?${query}` : "/tickets";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [paramsKey, router],
  );

  useEffect(() => {
    const params = new URLSearchParams(paramsKey);
    if (values.search === (params.get("search") ?? "")) return;

    searchTimer.current = setTimeout(() => {
      navigateWithFilters(valuesRef.current, queueRef.current, true);
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [navigateWithFilters, paramsKey, values.search]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    navigateWithFilters(valuesRef.current, queueRef.current, false);
  }

  function handleFilterChange(name: FilterName, value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const nextValues = { ...values, [name]: value };
    valuesRef.current = nextValues;
    setValues(nextValues);
    navigateWithFilters(nextValues, queueRef.current, false);
  }

  function handleQueueChange(nextQueue: TicketQueue) {
    if (nextQueue === selectedQueue) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    queueRef.current = nextQueue;
    setSelectedQueue(nextQueue);
    navigateWithFilters(valuesRef.current, nextQueue, false);
  }

  function handleReset() {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const emptyValues = {
      search: "",
      status: "",
      priority: "",
      departmentId: "",
      categoryId: "",
      assigneeId: "",
    };
    valuesRef.current = emptyValues;
    setValues(emptyValues);
    queueRef.current = "all";
    setSelectedQueue("all");
    router.push("/tickets", { scroll: false });
  }

  const isPrivilegedUser = ["AGENT", "ADMIN"].includes(userRole);

  return (
    <div className="space-y-3">
      {/* Only render the queue switcher block if the user is an AGENT or ADMIN */}
      {isPrivilegedUser && (
        <div
          role="group"
          aria-label="Ticket queue"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
        >
          <button
            type="button"
            aria-pressed={selectedQueue === "all"}
            onClick={() => handleQueueChange("all")}
            className={`min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              selectedQueue === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Queue
          </button>
          <button
            type="button"
            aria-pressed={selectedQueue === "assigned"}
            onClick={() => handleQueueChange("assigned")}
            className={`min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              selectedQueue === "assigned"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Assigned to Me
          </button>
        </div>
      )}

      <form
        action="/tickets"
        method="get"
        aria-label="Search and filter tickets"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <div className="relative min-w-0 w-full flex-[2_1_18rem] sm:min-w-[18rem]">
          <label htmlFor="search" className="sr-only">
            Search tickets
          </label>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            id="search"
            name="search"
            type="search"
            maxLength={100}
            value={values.search}
            onChange={(event) => {
              const nextValues = { ...valuesRef.current, search: event.target.value };
              valuesRef.current = nextValues;
              setValues(nextValues);
            }}
            placeholder="Search title, ticket #, or requester"
            className={`${controlClassName} pl-9 placeholder:text-slate-400`}
          />
        </div>

        <div className="w-full min-w-0 flex-[1_1_8.5rem] sm:w-auto sm:min-w-[8.5rem]">
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" value={values.status} onChange={(event) => handleFilterChange("status", event.target.value)} className={controlClassName}>
            <option value="">All statuses</option>
            {Object.values(TicketStatus).map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-0 flex-[1_1_8.5rem] sm:w-auto sm:min-w-[8.5rem]">
          <label htmlFor="priority" className="sr-only">Priority</label>
          <select id="priority" name="priority" value={values.priority} onChange={(event) => handleFilterChange("priority", event.target.value)} className={controlClassName}>
            <option value="">All priorities</option>
            {Object.values(Priority).map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-0 flex-[1_1_8.5rem] sm:w-auto sm:min-w-[8.5rem]">
          <label htmlFor="departmentId" className="sr-only">Department</label>
          <select id="departmentId" name="departmentId" value={values.departmentId} onChange={(event) => handleFilterChange("departmentId", event.target.value)} className={controlClassName}>
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-0 flex-[1_1_8.5rem] sm:w-auto sm:min-w-[8.5rem]">
          <label htmlFor="categoryId" className="sr-only">Category</label>
          <select id="categoryId" name="categoryId" value={values.categoryId} onChange={(event) => handleFilterChange("categoryId", event.target.value)} className={controlClassName}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-0 flex-[1_1_8.5rem] sm:w-auto sm:min-w-[8.5rem]">
          <label htmlFor="assigneeId" className="sr-only">Assignee</label>
          <select id="assigneeId" name="assigneeId" value={values.assigneeId} onChange={(event) => handleFilterChange("assigneeId", event.target.value)} className={controlClassName}>
            <option value="">All assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </form>
    </div>
  );
}