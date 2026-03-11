"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    createIncomeSource,
    deleteIncomeSource,
    updateIncomeSource,
} from "@/src/lib/actions/income";
import { Category, IncomeSource, Transaction } from "@/src/types";

const MONTH_NAMES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatAmount(n: number) {
    return new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

interface Props {
    userId: string;
    month: number;
    year: number;
    initialTransactions: Transaction[];
    categories: Category[];
    initialIncomeSources: IncomeSource[];
}

export default function DashboardClient({
    userId,
    month,
    year,
    initialTransactions,
    categories,
    initialIncomeSources,
}: Props) {
    const router = useRouter();
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(initialIncomeSources);
    const [, startTransition] = useTransition();

    // ── Month navigation ────────────────────────────────────────────────────
    function navigate(delta: number) {
        let m = month + delta;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        router.push(`/dashboard?m=${y}-${String(m).padStart(2, "0")}`);
    }

    // ── Cashflow calculations ────────────────────────────────────────────────
    const approvedExpenses = useMemo(
        () => initialTransactions.filter((t) => t.status === "approved" && t.type === "gasto"),
        [initialTransactions],
    );

    const totalIncome = useMemo(
        () => incomeSources.reduce((s, i) => s + Number(i.amount), 0),
        [incomeSources],
    );

    const totalExpenses = useMemo(
        () => approvedExpenses.reduce((s, t) => s + Number(t.amount), 0),
        [approvedExpenses],
    );

    const netCashflow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : null;

    // ── Expenses by category ─────────────────────────────────────────────────
    const expensesByCategory = useMemo(() => {
        const map = new Map<string, { name: string; color: string; total: number }>();

        for (const t of approvedExpenses) {
            const key = t.category_id ?? "__none__";
            const name = t.category?.name ?? "Sin categoría";
            const color = t.category?.color ?? "#6b7280";
            if (!map.has(key)) map.set(key, { name, color, total: 0 });
            map.get(key)!.total += Number(t.amount);
        }

        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [approvedExpenses]);

    const maxCategoryTotal = expensesByCategory[0]?.total ?? 1;

    // ── Income CRUD ──────────────────────────────────────────────────────────
    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [addingIncome, setAddingIncome] = useState(false);

    async function handleAddIncome(e: React.FormEvent) {
        e.preventDefault();
        const amount = parseFloat(newAmount.replace(",", "."));
        if (!newName.trim() || isNaN(amount) || amount <= 0) return;

        setAddingIncome(true);
        try {
            const created = await createIncomeSource({
                user_id: userId,
                month,
                year,
                name: newName.trim(),
                amount,
            });
            setIncomeSources((prev) => [...prev, created]);
            setNewName("");
            setNewAmount("");
        } catch {
            toast.error("Error al guardar el ingreso.");
        } finally {
            setAddingIncome(false);
        }
    }

    function handleDeleteIncome(id: string) {
        setIncomeSources((prev) => prev.filter((i) => i.id !== id));
        startTransition(async () => {
            await deleteIncomeSource(id);
        });
    }

    // ── Inline edit ──────────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editAmount, setEditAmount] = useState("");

    function startEdit(source: IncomeSource) {
        setEditingId(source.id);
        setEditName(source.name);
        setEditAmount(String(source.amount));
    }

    async function commitEdit(id: string) {
        const amount = parseFloat(editAmount.replace(",", "."));
        if (!editName.trim() || isNaN(amount) || amount <= 0) return;

        setIncomeSources((prev) =>
            prev.map((i) => i.id === id ? { ...i, name: editName.trim(), amount } : i),
        );
        setEditingId(null);

        startTransition(async () => {
            await updateIncomeSource(id, editName.trim(), amount);
        });
    }

    // ── Savings rate color ────────────────────────────────────────────────────
    const savingsColor =
        savingsRate === null ? "var(--color-text-muted)"
            : savingsRate >= 30 ? "#16a34a"
                : savingsRate >= 15 ? "#d97706"
                    : "#dc2626";

    const inputStyle: React.CSSProperties = {
        background: "var(--color-surface, var(--color-panel-bg))",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        borderRadius: "6px",
        padding: "5px 9px",
        fontSize: "12px",
        outline: "none",
    };

    return (
        <div className="p-6 space-y-5">

            {/* Header + month nav */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Dashboard
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Flujo de caja — {MONTH_NAMES[month]} {year}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <NavButton onClick={() => navigate(-1)}>‹</NavButton>
                    <span className="px-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <NavButton onClick={() => navigate(1)}>›</NavButton>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard
                    label="Total ingresos"
                    value={`S/ ${formatAmount(totalIncome)}`}
                    color="#16a34a"
                    bg="#f0fdf4"
                    border="#bbf7d0"
                />
                <KpiCard
                    label="Gastos aprobados"
                    value={`S/ ${formatAmount(totalExpenses)}`}
                    color="#dc2626"
                    bg="#fef2f2"
                    border="#fecaca"
                />
                <KpiCard
                    label="Flujo neto"
                    value={`${netCashflow >= 0 ? "+" : ""}S/ ${formatAmount(Math.abs(netCashflow))}`}
                    color={netCashflow >= 0 ? "#16a34a" : "#dc2626"}
                    bg={netCashflow >= 0 ? "#f0fdf4" : "#fef2f2"}
                    border={netCashflow >= 0 ? "#bbf7d0" : "#fecaca"}
                />
                <KpiCard
                    label="Tasa de ahorro"
                    value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—"}
                    color={savingsColor}
                    bg="var(--color-panel-bg)"
                    border="var(--color-border)"
                    sub={
                        savingsRate !== null
                            ? savingsRate >= 30 ? "Excelente"
                                : savingsRate >= 15 ? "Aceptable"
                                    : "Mejorable"
                            : "Registra ingresos"
                    }
                />
            </div>

            {/* Main 2-column layout */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* ── Ingresos ── */}
                <div
                    className="rounded-lg p-4 space-y-3"
                    style={{ background: "var(--color-panel-bg)", border: "1px solid var(--color-border)" }}
                >
                    <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Ingresos del mes
                    </h2>

                    {incomeSources.length === 0 && (
                        <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                            Sin ingresos registrados. Agrega tu sueldo u otras fuentes.
                        </p>
                    )}

                    <div className="space-y-1.5">
                        {incomeSources.map((src) =>
                            editingId === src.id ? (
                                <div key={src.id} className="flex items-center gap-2">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{ ...inputStyle, flex: 1 }}
                                        autoFocus
                                    />
                                    <input
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        type="number"
                                        style={{ ...inputStyle, width: "100px" }}
                                    />
                                    <button
                                        onClick={() => commitEdit(src.id)}
                                        className="rounded px-2 py-1 text-xs font-medium text-white"
                                        style={{ background: "var(--color-accent)" }}
                                    >
                                        OK
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="rounded px-2 py-1 text-xs"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div
                                    key={src.id}
                                    className="group flex items-center justify-between rounded-md px-3 py-2 transition"
                                    style={{ background: "var(--color-surface, rgba(0,0,0,0.02))", border: "1px solid var(--color-border-subtle)" }}
                                >
                                    <div>
                                        <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                                            {src.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold tabular-nums" style={{ color: "#16a34a" }}>
                                            S/ {formatAmount(Number(src.amount))}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => startEdit(src)}
                                                className="rounded p-1 text-xs transition"
                                                style={{ color: "var(--color-text-muted)" }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
                                                title="Editar"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => handleDeleteIncome(src.id)}
                                                className="rounded p-1 text-xs transition"
                                                style={{ color: "var(--color-text-muted)" }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Separator + total */}
                    {incomeSources.length > 0 && (
                        <div className="flex justify-between pt-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                            <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>Total</span>
                            <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
                                S/ {formatAmount(totalIncome)}
                            </span>
                        </div>
                    )}

                    {/* Add income form */}
                    <form onSubmit={handleAddIncome} className="flex items-center gap-2 pt-1">
                        <input
                            placeholder="Ej: Sueldo, Freelance…"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <input
                            placeholder="S/ 0.00"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            style={{ ...inputStyle, width: "90px" }}
                        />
                        <button
                            type="submit"
                            disabled={addingIncome}
                            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                            style={{ background: "var(--color-accent)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-accent-hover)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-accent)"; }}
                        >
                            + Agregar
                        </button>
                    </form>
                </div>

                {/* ── Gastos por categoría ── */}
                <div
                    className="rounded-lg p-4 space-y-3"
                    style={{ background: "var(--color-panel-bg)", border: "1px solid var(--color-border)" }}
                >
                    <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Gastos por categoría
                        <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                            (aprobados)
                        </span>
                    </h2>

                    {expensesByCategory.length === 0 ? (
                        <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                            Sin gastos aprobados este mes.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {expensesByCategory.map((cat) => {
                                const pct = totalIncome > 0
                                    ? (cat.total / totalIncome) * 100
                                    : (cat.total / (totalExpenses || 1)) * 100;
                                const barWidth = (cat.total / maxCategoryTotal) * 100;

                                return (
                                    <div key={cat.name}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="h-2 w-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                                                    {totalIncome > 0 ? `${pct.toFixed(1)}% ing.` : `${pct.toFixed(1)}%`}
                                                </span>
                                                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                                                    S/ {formatAmount(cat.total)}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className="h-1.5 w-full rounded-full overflow-hidden"
                                            style={{ background: "var(--color-border-subtle)" }}
                                        >
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Total */}
                    {expensesByCategory.length > 0 && (
                        <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                            <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>Total gastos</span>
                            <span className="text-sm font-bold" style={{ color: "#dc2626" }}>
                                S/ {formatAmount(totalExpenses)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Cashflow summary bar */}
            {totalIncome > 0 && totalExpenses > 0 && (
                <div
                    className="rounded-lg p-4"
                    style={{ background: "var(--color-panel-bg)", border: "1px solid var(--color-border)" }}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            Distribución del ingreso
                        </h2>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            S/ {formatAmount(totalIncome)} base
                        </span>
                    </div>
                    <div className="flex h-5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-border-subtle)" }}>
                        <div
                            className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{
                                width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%`,
                                background: "#dc2626",
                                minWidth: totalExpenses > 0 ? "2px" : "0",
                            }}
                        >
                            {(totalExpenses / totalIncome) * 100 > 12 && `${((totalExpenses / totalIncome) * 100).toFixed(0)}%`}
                        </div>
                        {netCashflow > 0 && (
                            <div
                                className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                                style={{
                                    width: `${(netCashflow / totalIncome) * 100}%`,
                                    background: "#16a34a",
                                }}
                            >
                                {(netCashflow / totalIncome) * 100 > 12 && `${((netCashflow / totalIncome) * 100).toFixed(0)}%`}
                            </div>
                        )}
                    </div>
                    <div className="mt-2 flex gap-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600 inline-block" /> Gastos</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600 inline-block" /> Ahorro / Flujo libre</span>
                    </div>
                </div>
            )}

        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
    label, value, color, bg, border, sub,
}: {
    label: string; value: string; color: string;
    bg: string; border: string; sub?: string;
}) {
    return (
        <div className="rounded-lg px-4 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                {label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color }}>
                {value}
            </p>
            {sub && <p className="mt-0.5 text-[10px]" style={{ color }}>{sub}</p>}
        </div>
    );
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="flex h-7 w-7 items-center justify-center rounded-md text-base font-bold transition"
            style={{
                background: "var(--color-panel-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-border-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-panel-bg)"; }}
        >
            {children}
        </button>
    );
}
