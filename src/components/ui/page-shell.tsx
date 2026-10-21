import type { ReactNode } from "react";
import { pageDescription, pageHeader, pageMain, pageTitle } from "./ui-classes";

export function PageShell({
  title,
  description,
  actions,
  children,
  headerClassName = "",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
}) {
  return (
    <main className={pageMain}>
      <header className={`${pageHeader} ${headerClassName}`.trim()}>
        <div className="min-w-0">
          <h1 className={pageTitle}>{title}</h1>
          {description ? <p className={pageDescription}>{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}
