"use client";

import { useState } from "react";

type DateRangePreset = "7d" | "30d" | "year" | "custom";

function getPresetDates(preset: Exclude<DateRangePreset, "custom">) {
  const to = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(`${to}T00:00:00.000Z`);
  if (preset === "7d") fromDate.setUTCDate(fromDate.getUTCDate() - 6);
  if (preset === "30d") fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  if (preset === "year") fromDate.setUTCMonth(0, 1);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function TicketReportDateRangeFields({
  initialRange,
  initialFrom,
  initialTo,
}: {
  initialRange: DateRangePreset;
  initialFrom: string;
  initialTo: string;
}) {
  const [range, setRange] = useState<DateRangePreset>(initialRange);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function changeRange(nextRange: DateRangePreset) {
    setRange(nextRange);
    if (nextRange !== "custom") {
      const dates = getPresetDates(nextRange);
      setFrom(dates.from);
      setTo(dates.to);
    }
  }

  function changeCustomDate(nextFrom: string, nextTo: string) {
    setRange("custom");
    setFrom(nextFrom);
    setTo(nextTo);
  }

  return (
    <>
      <div>
        <label htmlFor="range" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Date range
        </label>
        <select
          id="range"
          name="range"
          value={range}
          onChange={(event) => changeRange(event.target.value as DateRangePreset)}
          className={inputClassName}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      <div>
        <label htmlFor="from" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Created from
        </label>
        <input
          id="from"
          name="from"
          type="date"
          value={from}
          onChange={(event) => changeCustomDate(event.target.value, to)}
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor="to" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Created through
        </label>
        <input
          id="to"
          name="to"
          type="date"
          value={to}
          onChange={(event) => changeCustomDate(from, event.target.value)}
          className={inputClassName}
        />
      </div>
    </>
  );
}
