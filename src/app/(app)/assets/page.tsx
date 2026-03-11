export default function AssetsPage() {
    return (
        <div className="p-6">
            {/* Page header */}
            <div className="mb-6">
                <h1
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Activos y Pasivos
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Gestión de tu patrimonio financiero
                </p>
            </div>

            {/* Empty state card */}
            <div
                className="flex flex-col items-center justify-center rounded-lg py-20 text-center"
                style={{
                    background: "var(--color-panel-bg)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: "var(--color-border-subtle)" }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                    </svg>
                </div>
                <h2
                    className="mb-2 text-base font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Próximamente
                </h2>
                <p className="max-w-sm text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    El módulo de activos y pasivos estará disponible próximamente. Aquí podrás registrar y seguir tu patrimonio financiero.
                </p>
                <span
                    className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                        background: "var(--color-border-subtle)",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    En desarrollo
                </span>
            </div>
        </div>
    );
}
