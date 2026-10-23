import type { SLAPolicyActionState } from "../schemas/sla.schema";
import type { SafeSLA } from "../types/sla";

const statuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "BREACHED", label: "Breached" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export function SLAPolicyFormFields({
  state,
  policy,
}: {
  state: SLAPolicyActionState;
  policy?: SafeSLA;
}) {
  return (
    <>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Policy name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={policy?.name}
          aria-invalid={Boolean(state.fieldErrors?.name?.length)}
          aria-describedby={
            state.fieldErrors?.name?.length ? "sla-name-error" : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        />
        {state.fieldErrors?.name?.[0] && (
          <p id="sla-name-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          Description{" "}
          <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={1000}
          rows={3}
          defaultValue={policy?.description ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.description?.length)}
          aria-describedby={
            state.fieldErrors?.description?.length
              ? "sla-description-error"
              : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        />
        {state.fieldErrors?.description?.[0] && (
          <p id="sla-description-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="responseTimeMinutes"
            className="mb-1 block text-sm font-medium"
          >
            Response time (minutes)
          </label>
          <input
            id="responseTimeMinutes"
            name="responseTimeMinutes"
            type="number"
            required
            min={1}
            max={2_147_483_647}
            step={1}
            defaultValue={policy?.responseTimeMinutes}
            aria-invalid={Boolean(
              state.fieldErrors?.responseTimeMinutes?.length,
            )}
            aria-describedby={
              state.fieldErrors?.responseTimeMinutes?.length
                ? "sla-response-error"
                : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />
          {state.fieldErrors?.responseTimeMinutes?.[0] && (
            <p id="sla-response-error" className="mt-1 text-sm text-red-700">
              {state.fieldErrors.responseTimeMinutes[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="resolutionTimeMinutes"
            className="mb-1 block text-sm font-medium"
          >
            Resolution time (minutes)
          </label>
          <input
            id="resolutionTimeMinutes"
            name="resolutionTimeMinutes"
            type="number"
            required
            min={1}
            max={2_147_483_647}
            step={1}
            defaultValue={policy?.resolutionTimeMinutes}
            aria-invalid={Boolean(
              state.fieldErrors?.resolutionTimeMinutes?.length,
            )}
            aria-describedby={
              state.fieldErrors?.resolutionTimeMinutes?.length
                ? "sla-resolution-error"
                : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />
          {state.fieldErrors?.resolutionTimeMinutes?.[0] && (
            <p id="sla-resolution-error" className="mt-1 text-sm text-red-700">
              {state.fieldErrors.resolutionTimeMinutes[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={policy?.status ?? "ACTIVE"}
          aria-invalid={Boolean(state.fieldErrors?.status?.length)}
          aria-describedby={
            state.fieldErrors?.status?.length ? "sla-status-error" : undefined
          }
          className="w-full rounded-md border px-3 py-2"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.status?.[0] && (
          <p id="sla-status-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.status[0]}
          </p>
        )}
      </div>
    </>
  );
}
