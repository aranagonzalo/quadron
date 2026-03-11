import Link from "next/link";

const features = [
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
        ),
        title: "Registro de transacciones",
        desc: "Importa tus estados de cuenta en PDF y clasifica cada movimiento automáticamente.",
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
        ),
        title: "Gestión de tarjetas",
        desc: "Administra múltiples tarjetas y cuentas bancarias desde un solo lugar.",
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
            </svg>
        ),
        title: "Control de activos",
        desc: "Visualiza tu patrimonio financiero: activos, pasivos y evolución en el tiempo.",
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        title: "Dashboard inteligente",
        desc: "Resumen mensual de ingresos, gastos y balance con métricas clave.",
    },
];

export default function Page() {
    return (
        <div style={{ background: "var(--color-canvas-bg)", color: "var(--color-text-primary)", minHeight: "100vh" }}>
            {/* Nav */}
            <header
                className="flex items-center justify-between px-8 py-4"
                style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-panel-bg)" }}
            >
                <div className="flex items-center gap-2.5">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white"
                        style={{ background: "var(--color-accent)" }}
                    >
                        Q
                    </span>
                    <span className="text-base font-bold">Quadron</span>
                </div>
                <Link
                    href="/login"
                    className="rounded-md px-4 py-1.5 text-sm font-medium text-white"
                    style={{ background: "var(--color-accent)" }}
                >
                    Iniciar sesión
                </Link>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-3xl px-6 py-24 text-center">
                <span
                    className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                        background: "var(--color-border-subtle)",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    Finanzas personales · versión beta
                </span>
                <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight">
                    Tu dinero,{" "}
                    <span style={{ color: "var(--color-accent)" }}>bajo control</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: "var(--color-text-secondary)" }}>
                    Quadron te ayuda a entender en qué gastas, cuánto ahorras y cómo evoluciona tu patrimonio mes a mes.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                    <Link
                        href="/login"
                        className="rounded-md px-6 py-2.5 text-sm font-semibold text-white"
                        style={{ background: "var(--color-accent)" }}
                    >
                        Comenzar gratis
                    </Link>
                    <a
                        href="#features"
                        className="rounded-md px-6 py-2.5 text-sm font-semibold"
                        style={{
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-panel-bg)",
                        }}
                    >
                        Ver funciones
                    </a>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="mx-auto max-w-4xl px-6 pb-24">
                <p
                    className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    Funcionalidades
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="rounded-lg p-5"
                            style={{
                                background: "var(--color-panel-bg)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            <div
                                className="mb-3 flex h-9 w-9 items-center justify-center rounded-md"
                                style={{ background: "var(--color-border-subtle)", color: "var(--color-accent)" }}
                            >
                                {f.icon}
                            </div>
                            <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer
                className="py-6 text-center text-xs"
                style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
                © {new Date().getFullYear()} Quadron · Gestión financiera personal
            </footer>
        </div>
    );
}
