"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { registerUser } from "@/src/lib/actions/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/src/components/ThemeProvider";

const loginSchema = z.object({
    email: z.email("Email inválido"),
    password: z.string().min(1, "Ingresa tu contraseña"),
});

const registerSchema = z
    .object({
        firstName: z.string().min(1, "Requerido"),
        lastName: z.string().min(1, "Requerido"),
        email: z.email("Email inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

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

function Field({
    label,
    error,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {label}
            </label>
            <input
                {...props}
                className="rounded-md px-3 py-2 text-sm outline-none transition"
                style={{
                    background: "var(--color-canvas-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--color-accent)";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(107, 79, 187, 0.12)";
                }}
                onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
                }}
            />
            {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}
        </div>
    );
}

function LoginForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data: LoginData) => {
        setServerError("");
        const res = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (res?.error) {
            setServerError("Email o contraseña incorrectos.");
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                {...register("email")}
            />
            <Field
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
            />
            {serverError && (
                <p className="text-sm" style={{ color: "#dc2626" }}>{serverError}</p>
            )}
            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 rounded-md py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: "var(--color-accent)" }}
                onMouseEnter={(e) => {
                    if (!isSubmitting) {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                    }
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                }}
            >
                {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
        </form>
    );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data: RegisterData) => {
        setServerError("");
        const res = await registerUser(data);

        if (res.error) {
            setServerError(res.error);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <Field
                    label="Nombre"
                    placeholder="Juan"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                />
                <Field
                    label="Apellido"
                    placeholder="Pérez"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                />
            </div>
            <Field
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                {...register("email")}
            />
            <Field
                label="Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                error={errors.password?.message}
                {...register("password")}
            />
            <Field
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
            />
            {serverError && (
                <p className="text-sm" style={{ color: "#dc2626" }}>{serverError}</p>
            )}
            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 rounded-md py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: "var(--color-accent)" }}
                onMouseEnter={(e) => {
                    if (!isSubmitting) {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                    }
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                }}
            >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
        </form>
    );
}

// ── AuthCard ──────────────────────────────────────────────────────────────────

type Tab = "login" | "register";

export default function AuthCard() {
    const [tab, setTab] = useState<Tab>("login");
    const { theme, toggle } = useTheme();

    return (
        <div
            className="relative w-full max-w-md rounded-xl p-8 shadow-lg"
            style={{
                background: "var(--color-panel-bg)",
                border: "1px solid var(--color-border)",
            }}
        >
            {/* Theme toggle */}
            <button
                onClick={toggle}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md transition"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                }}
                aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Brand */}
            <div className="mb-6 flex items-center gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
                    style={{ background: "var(--color-accent)" }}
                >
                    Q
                </span>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                        Quadron
                    </h1>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {tab === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta"}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div
                className="mb-6 flex rounded-lg p-1"
                style={{ background: "var(--color-canvas-bg)", border: "1px solid var(--color-border-subtle)" }}
            >
                {(["login", "register"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="flex-1 rounded-md py-1.5 text-sm font-medium transition"
                        style={
                            tab === t
                                ? {
                                    background: "var(--color-panel-bg)",
                                    color: "var(--color-text-primary)",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                }
                                : {
                                    background: "transparent",
                                    color: "var(--color-text-muted)",
                                }
                        }
                    >
                        {t === "login" ? "Ingresar" : "Registrarse"}
                    </button>
                ))}
            </div>

            {tab === "login" ? (
                <LoginForm />
            ) : (
                <RegisterForm onSuccess={() => setTab("login")} />
            )}
        </div>
    );
}
