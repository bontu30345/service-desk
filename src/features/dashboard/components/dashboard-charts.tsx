"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { cardSurface } from "@/components/ui/ui-classes";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

function subscribeToMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function useIsMounted() {
  return useSyncExternalStore(
    subscribeToMounted,
    getMountedSnapshot,
    getMountedServerSnapshot,
  );
}

// Dynamically import ReactApexChart with SSR disabled for Next.js App Router safety
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
      Loading chart...
    </div>
  ),
});

type DashboardChartDatum = {
  key: string;
  label: string;
  count: number;
  color: string;
};

function StatusDonutChart({
  title,
  description,
  data,
  reducedMotion,
}: {
  title: string;
  description: string;
  data: DashboardChartDatum[];
  reducedMotion: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const series = data.map((item) => item.count);
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      animations: {
        enabled: !reducedMotion,
        easing: "easeinout",
        speed: 500,
      },
      toolbar: {
        show: false,
      },
    },
    labels: data.map((item) => item.label),
    colors: data.map((item) => item.color),
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "13px",
      markers: {
        size: 7,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: {
        fontSize: "12px",
        fontWeight: "600",
      },
      dropShadow: {
        enabled: false,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Scope",
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748b",
              formatter: () => total.toLocaleString(),
            },
            value: {
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              formatter: (val: string) => Number(val).toLocaleString(),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} tickets`,
      },
    },
    stroke: {
      width: 2,
      colors: ["#ffffff"],
    },
  };

  return (
    <section className={`min-w-0 p-4 sm:p-5 ${cardSurface}`}>
      <header>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </header>
      {total === 0 ? (
        <p className="mt-6 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          No tickets in this scope yet.
        </p>
      ) : (
        <div className="mt-4 h-64 min-w-0 w-full" role="group" aria-label={`${title} donut chart`}>
          <ReactApexChart options={options} series={series} type="donut" height="100%" />
        </div>
      )}
    </section>
  );
}

function PriorityBarChart({
  title,
  description,
  data,
  reducedMotion,
  horizontal = false,
}: {
  title: string;
  description: string;
  data: DashboardChartDatum[];
  reducedMotion: boolean;
  horizontal?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartHeight = horizontal ? Math.max(256, data.length * 38) : 256;

  const series = [
    {
      name: "Tickets",
      data: horizontal
        ? data.map((item) => ({ x: item.label, y: item.count }))
        : data.map((item) => item.count),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "inherit",
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: !reducedMotion,
        easing: "easeinout",
        speed: 500,
      },
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 6,
        columnWidth: "55%",
        distributed: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    colors: data.map((item) => item.color),
    xaxis: {
      ...(!horizontal ? { categories: data.map((item) => item.label) } : {}),
      labels: {
        style: {
          fontSize: "12px",
          colors: "#64748b",
        },
      },
    },
    yaxis: {
      labels: {
        ...(horizontal ? { maxWidth: 220 } : {}),
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: horizontal ? data.map(() => "#475569") : "#1e293b",
        },
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        colors: ["#1e293b"],
      },
      formatter: (val: number) => val.toLocaleString(),
      offsetY: horizontal ? 0 : -20,
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} tickets`,
      },
    },
  };

  return (
    <section className={`min-w-0 p-4 sm:p-5 ${cardSurface}`}>
      <header>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </header>
      {total === 0 ? (
        <p className="mt-6 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          No tickets in this scope yet.
        </p>
      ) : (
        <div className="mt-4 min-w-0 w-full" style={{ height: chartHeight }} role="group" aria-label={`${title} bar chart`}>
          <ReactApexChart options={options} series={series} type="bar" height={chartHeight} />
        </div>
      )}
    </section>
  );
}

export function DashboardCharts({
  statusTitle,
  priorityTitle,
  statusData,
  priorityData,
  departmentData = [],
}: {
  statusTitle: string;
  priorityTitle: string;
  statusData: DashboardChartDatum[];
  priorityData: DashboardChartDatum[];
  departmentData?: DashboardChartDatum[];
}) {
  const isMounted = useIsMounted();
  const reducedMotion = useReducedMotion();

  if (!isMounted) {
    return (
      <section
        aria-label="Ticket charts"
        className="grid min-w-0 gap-5 lg:grid-cols-2"
      >
        <div className={`h-72 w-full animate-pulse p-5 ${cardSurface}`} />
        <div className={`h-72 w-full animate-pulse p-5 ${cardSurface}`} />
        <div className={`h-72 w-full animate-pulse p-5 ${cardSurface}`} />
      </section>
    );
  }

  return (
    <section
      aria-label="Ticket charts"
      className="grid min-w-0 gap-5 xl:grid-cols-3 animate-fade-in"
    >
      <StatusDonutChart
        title="Tickets by status"
        description={statusTitle}
        data={statusData}
        reducedMotion={reducedMotion}
      />
      <PriorityBarChart
        title="Tickets by priority"
        description={priorityTitle}
        data={priorityData}
        reducedMotion={reducedMotion}
      />
      <PriorityBarChart
        title="Tickets by department"
        description="Filtered ticket volume by responsible department"
        data={departmentData}
        reducedMotion={reducedMotion}
        horizontal
      />
    </section>
  );
}
