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

function ProfileRow({ label, value }: { label: string; value: string }) {
    return (
        <div
            className="flex items-center justify-between py-3"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {label}
            </span>
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                {value}
            </span>
        </div>
    );
}

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    const initials = getInitials(user?.name);

    return (
        <div className="p-6">
            {/* Page header */}
            <div className="mb-6">
                <h1
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Perfil
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Información de tu cuenta
                </p>
            </div>

            <div className="max-w-lg space-y-4">
                {/* Avatar + name card */}
                <div
                    className="flex items-center gap-5 rounded-lg p-6"
                    style={{
                        background: "var(--color-panel-bg)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <span
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                        style={{ background: "var(--color-accent)" }}
                    >
                        {initials}
                    </span>
                    <div>
                        <p
                            className="text-lg font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            {user?.name ?? "Usuario"}
                        </p>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {user?.email ?? "—"}
                        </p>
                        <span
                            className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                                background: "var(--color-border-subtle)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            Cuenta activa
                        </span>
                    </div>
                </div>

                {/* Info card */}
                <div
                    className="rounded-lg px-5"
                    style={{
                        background: "var(--color-panel-bg)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <p
                        className="py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        Detalles de la cuenta
                    </p>
                    <ProfileRow label="Nombre completo" value={user?.name ?? "—"} />
                    <ProfileRow label="Correo electrónico" value={user?.email ?? "—"} />
                    <ProfileRow label="Rol" value="Usuario" />
                    <div className="py-3">
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            ID de usuario
                        </span>
                        <p
                            className="mt-1 font-mono text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            {(user as { id?: string })?.id ?? "—"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
