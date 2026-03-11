import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}

interface StatCardProps {
    label: string;
    value: string;
    description?: string;
    accentColor?: string;
}

function StatCard({ label, value, description, accentColor = "#6b4fbb" }: StatCardProps) {
    return (
        <div
            className="rounded-lg p-5"
            style={{
                background: "var(--color-panel-bg)",
                border: "1px solid var(--color-border)",
            }}
        >
            <p
                className="mb-1 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
            >
                {label}
            </p>
            <p
                className="text-2xl font-bold"
                style={{ color: accentColor }}
            >
                {value}
            </p>
            {description && (
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {description}
                </p>
            )}
        </div>
    );
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <div className="p-6 space-y-6">
            {/* Page header */}
            <div>
                <h1
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Dashboard
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Resumen de tus finanzas personales
                </p>
            </div>

            {/* Welcome card */}
            <div
                className="flex items-center gap-4 rounded-lg p-5"
                style={{
                    background: "var(--color-panel-bg)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: "var(--color-accent)" }}
                >
                    {getInitials(user?.name)}
                </span>
                <div>
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Bienvenido, {user?.name ?? "Usuario"}
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {user?.email}
                    </p>
                </div>
            </div>

            {/* Section header */}
            <div>
                <h2
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    Este mes
                </h2>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    label="Total Gastos"
                    value="S/ 0.00"
                    description="Transacciones aprobadas"
                    accentColor="#ef4444"
                />
                <StatCard
                    label="Total Abonos"
                    value="S/ 0.00"
                    description="Ingresos del mes"
                    accentColor="#22c55e"
                />
                <StatCard
                    label="Pendientes"
                    value="0"
                    description="Por revisar"
                    accentColor="#f59e0b"
                />
                <StatCard
                    label="Aprobadas"
                    value="0"
                    description="Transacciones confirmadas"
                    accentColor="var(--color-accent)"
                />
            </div>

            {/* Quick actions */}
            <div
                className="rounded-lg p-5"
                style={{
                    background: "var(--color-panel-bg)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <h3
                    className="mb-3 text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Acciones rápidas
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Navega a{" "}
                    <a
                        href="/transactions"
                        className="font-medium"
                        style={{ color: "var(--color-accent)" }}
                    >
                        Transacciones
                    </a>{" "}
                    para cargar tu estado de cuenta y empezar a gestionar tus finanzas.
                </p>
            </div>
        </div>
    );
}
