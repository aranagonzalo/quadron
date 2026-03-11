"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTheme } from "@/src/components/ThemeProvider";

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleString("es-PE", {
    month: "long",
    year: "numeric",
  });
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();

  const now = new Date();
  const defaultM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mParam = searchParams.get("m") || defaultM;
  const [year, month] = mParam.split("-").map(Number);

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("m", `${y}-${String(m).padStart(2, "0")}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      className="flex shrink-0 items-center justify-between px-6 py-3"
      style={{
        background: "var(--color-panel-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Left: empty spacer */}
      <div className="w-32" />

      {/* Center: month selector */}
      <div
        className="flex items-center gap-3 text-sm font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="min-w-[160px] text-center capitalize">
          {getMonthLabel(year, month)}
        </span>
        <button
          onClick={() => navigate(1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Right: theme toggle */}
      <div className="flex w-32 justify-end">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-md transition"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
          }}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  );
}
