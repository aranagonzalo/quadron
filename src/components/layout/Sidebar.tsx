"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface User {
    name?: string | null;
    email?: string | null;
}

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}

const DashboardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const TransactionsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const AssetsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const SignOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const navLinks = [
    { label: "Dashboard", href: "/dashboard", Icon: DashboardIcon },
    { label: "Transacciones", href: "/transactions", Icon: TransactionsIcon },
    { label: "Activos / Pasivos", href: "/assets", Icon: AssetsIcon },
];

export default function Sidebar({ user }: { user: User | null }) {
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    const linkBase: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 10px",
        borderRadius: "6px",
        fontSize: "13.5px",
        fontWeight: 500,
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
        cursor: "pointer",
    };

    return (
        <aside
            className="flex h-full w-56 shrink-0 flex-col"
            style={{
                background: "var(--color-sidebar-bg)",
                borderRight: "1px solid var(--color-sidebar-border)",
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-2.5 px-4 py-5"
                style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
            >
                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
                    style={{ background: "var(--color-accent)" }}
                >
                    Q
                </span>
                <span
                    className="text-base font-bold"
                    style={{ color: "var(--color-sidebar-text)" }}
                >
                    Quadron
                </span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 px-2 py-3">
                <p
                    className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-sidebar-text-muted)" }}
                >
                    Navegación
                </p>
                {navLinks.map(({ label, href, Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                ...linkBase,
                                background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                                color: active ? "var(--color-accent)" : "var(--color-sidebar-text)",
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-sidebar-hover-bg)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                }
                            }}
                        >
                            <span style={{ color: active ? "var(--color-accent)" : "var(--color-sidebar-text-muted)" }}>
                                <Icon />
                            </span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div
                className="mt-auto flex flex-col gap-0.5 px-2 py-3"
                style={{ borderTop: "1px solid var(--color-sidebar-border)" }}
            >
                {/* Profile */}
                {(() => {
                    const active = isActive("/profile");
                    return (
                        <Link
                            href="/profile"
                            style={{
                                ...linkBase,
                                background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                                color: active ? "var(--color-accent)" : "var(--color-sidebar-text)",
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-sidebar-hover-bg)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                }
                            }}
                        >
                            <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                style={{ background: "var(--color-accent)" }}
                            >
                                {getInitials(user?.name)}
                            </span>
                            <span className="truncate">{user?.name ?? "Perfil"}</span>
                        </Link>
                    );
                })()}

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                        ...linkBase,
                        color: "var(--color-sidebar-text-muted)",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-sidebar-hover-bg)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--color-sidebar-text)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--color-sidebar-text-muted)";
                    }}
                >
                    <SignOutIcon />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
