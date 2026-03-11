"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import {
    getTransactions,
    updateCategory,
    updateSubcategory,
    updateStatus,
} from "@/src/lib/actions/transactions";
import { Card, Category, Subcategory, Transaction } from "@/src/types";

import AddTransactionModal from "./AddTransactionModal";
import CardManager from "./CardManager";
import UploadStatement from "./UploadStatement";

type FilterTab = "all" | "pending" | "approved" | "rejected";

interface Props {
    initialTransactions: Transaction[];
    categories: Category[];
    subcategories: Subcategory[];
    cards: Card[];
    userId: string;
    month: number;
    year: number;
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
};

const STATUS_STYLES: Record<string, React.CSSProperties> = {
    pending: { background: "#fef3c7", color: "#92400e" },
    approved: { background: "#d1fae5", color: "#065f46" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
};

function formatAmount(amount: number): string {
    return new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

export default function TransactionsClient({
    initialTransactions,
    categories,
    subcategories,
    cards: initialCards,
    userId,
    month,
    year,
}: Props) {
    const [transactions, setTransactions] =
        useState<Transaction[]>(initialTransactions);
    const [cards, setCards] = useState<Card[]>(initialCards);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showCardManager, setShowCardManager] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [cardFilter, setCardFilter] = useState<string>("all");
    const [, startTransition] = useTransition();

    // Reload transactions from server
    const reloadTransactions = useCallback(() => {
        startTransition(async () => {
            const fresh = await getTransactions(userId, month, year);
            setTransactions(fresh);
            setSelected(new Set());
        });
    }, [userId, month, year]);

    // Filtered transactions
    const filtered = useMemo(() => {
        let list = transactions;

        if (activeTab !== "all") {
            list = list.filter((t) => t.status === activeTab);
        }

        if (cardFilter !== "all") {
            list = list.filter((t) => t.card_id === cardFilter);
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (t) =>
                    t.description.toLowerCase().includes(q) ||
                    t.amount.toString().includes(q) ||
                    (t.card?.name?.toLowerCase().includes(q) ?? false),
            );
        }

        return list;
    }, [transactions, activeTab, cardFilter, search]);

    // Counts per tab
    const counts = useMemo(() => {
        return {
            all: transactions.length,
            pending: transactions.filter((t) => t.status === "pending").length,
            approved: transactions.filter((t) => t.status === "approved").length,
            rejected: transactions.filter((t) => t.status === "rejected").length,
        };
    }, [transactions]);

    // Stats
    const stats = useMemo(() => {
        const approved = transactions
            .filter((t) => t.status === "approved" && t.type === "gasto")
            .reduce((s, t) => s + Number(t.amount), 0);
        const pending = transactions
            .filter((t) => t.status === "pending")
            .reduce((s, t) => s + Number(t.amount), 0);
        const rejected = transactions
            .filter((t) => t.status === "rejected")
            .reduce((s, t) => s + Number(t.amount), 0);
        const total = transactions.length;
        return { approved, pending, rejected, total };
    }, [transactions]);

    // Total of filtered visible transactions
    const filteredTotal = useMemo(
        () =>
            filtered.reduce(
                (s, t) =>
                    s +
                    (t.type === "gasto" ? Number(t.amount) : -Number(t.amount)),
                0,
            ),
        [filtered],
    );

    // Selection helpers
    const allFilteredSelected =
        filtered.length > 0 && filtered.every((t) => selected.has(t.id));

    function toggleSelectAll() {
        if (allFilteredSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map((t) => t.id)));
        }
    }

    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Actions
    function handleBulkStatus(status: "approved" | "rejected" | "pending") {
        const ids = Array.from(selected);
        if (ids.length === 0) return;

        // Optimistic update
        setTransactions((prev) =>
            prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t)),
        );
        setSelected(new Set());

        startTransition(async () => {
            await updateStatus(ids, status);
        });
    }

    function handleSingleStatus(
        id: string,
        status: "approved" | "rejected" | "pending",
    ) {
        // Optimistic update
        setTransactions((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status } : t)),
        );

        startTransition(async () => {
            await updateStatus([id], status);
        });
    }

    function handleCategoryChange(id: string, categoryId: string) {
        const category = categories.find((c) => c.id === categoryId) ?? undefined;

        // Clear subcategory when category changes
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, category_id: categoryId, category, subcategory_id: undefined, subcategory: undefined }
                    : t,
            ),
        );

        startTransition(async () => {
            await updateCategory(id, categoryId);
        });
    }

    function handleSubcategoryChange(id: string, subcategoryId: string | null) {
        const subcategory = subcategoryId
            ? subcategories.find((s) => s.id === subcategoryId)
            : undefined;

        setTransactions((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, subcategory_id: subcategoryId ?? undefined, subcategory }
                    : t,
            ),
        );

        startTransition(async () => {
            await updateSubcategory(id, subcategoryId);
        });
    }

    const tabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: "Todos" },
        { key: "pending", label: "Pendientes" },
        { key: "approved", label: "Aprobados" },
        { key: "rejected", label: "Rechazados" },
    ];

    return (
        <div className="p-6 space-y-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Transacciones
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Gestiona tus movimientos del mes
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddTransaction(true)}
                        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition"
                        style={{ background: "var(--color-accent)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                        }}
                    >
                        + Registrar gasto
                    </button>
                    <button
                        onClick={() => setShowCardManager((v) => !v)}
                        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition"
                        style={{
                            background: "var(--color-panel-bg)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-primary)",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-panel-bg)";
                        }}
                    >
                        {showCardManager ? "Ocultar tarjetas" : "Mis tarjetas"}
                    </button>
                </div>
            </div>

            {/* Card Manager Modal */}
            <Dialog open={showCardManager} onOpenChange={setShowCardManager}>
                <DialogContent title="Mis tarjetas">
                    <CardManager
                        cards={cards}
                        userId={userId}
                        onCardsChange={setCards}
                    />
                </DialogContent>
            </Dialog>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                open={showAddTransaction}
                onClose={() => setShowAddTransaction(false)}
                onCreated={(t) => setTransactions((prev) => [t, ...prev])}
                userId={userId}
                cards={cards}
                categories={categories}
                subcategories={subcategories}
                defaultMonth={month}
                defaultYear={year}
            />

            {/* Upload section */}
            <UploadStatement
                cards={cards}
                userId={userId}
                onImported={() => reloadTransactions()}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                    label="Total aprobado"
                    value={`S/ ${formatAmount(stats.approved)}`}
                    valueStyle={{ color: "#16a34a" }}
                    bgStyle={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                />
                <StatCard
                    label="Pendiente"
                    value={`S/ ${formatAmount(stats.pending)}`}
                    valueStyle={{ color: "#d97706" }}
                    bgStyle={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                />
                <StatCard
                    label="Rechazado"
                    value={`S/ ${formatAmount(stats.rejected)}`}
                    valueStyle={{ color: "#dc2626" }}
                    bgStyle={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                />
                <StatCard
                    label="Total extraídas"
                    value={stats.total.toString()}
                    valueStyle={{ color: "var(--color-accent)" }}
                    bgStyle={{
                        background: "var(--color-panel-bg)",
                        border: "1px solid var(--color-border)",
                    }}
                />
            </div>

            {/* Table section */}
            <div
                className="rounded-lg overflow-hidden"
                style={{
                    background: "var(--color-panel-bg)",
                    border: "1px solid var(--color-border)",
                }}
            >
                {/* Toolbar */}
                <div
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                    {/* Filter tabs */}
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setSelected(new Set());
                                }}
                                className="rounded-md px-3 py-1 text-xs font-medium transition"
                                style={
                                    activeTab === tab.key
                                        ? { background: "var(--color-accent)", color: "#fff" }
                                        : { background: "transparent", color: "var(--color-text-secondary)" }
                                }
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.key) {
                                        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.key) {
                                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                    }
                                }}
                            >
                                {tab.label}
                                <span
                                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                    style={
                                        activeTab === tab.key
                                            ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                                            : { background: "var(--color-border-subtle)", color: "var(--color-text-muted)" }
                                    }
                                >
                                    {counts[tab.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Card filter */}
                        {cards.length > 0 && (
                            <select
                                value={cardFilter}
                                onChange={(e) => setCardFilter(e.target.value)}
                                className="rounded-md px-2.5 py-1.5 text-xs focus:outline-none"
                                style={{
                                    background: "var(--color-panel-bg)",
                                    border: "1px solid var(--color-border)",
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                <option value="all">Todas las tarjetas</option>
                                {cards.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.last_four ? ` •••• ${c.last_four}` : ""}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Search */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar transacción..."
                            className="w-48 rounded-md px-3 py-1.5 text-xs focus:outline-none"
                            style={{
                                background: "var(--color-panel-bg)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-primary)",
                            }}
                        />
                    </div>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div
                        className="flex items-center gap-3 px-4 py-2"
                        style={{
                            background: "rgba(107, 79, 187, 0.08)",
                            borderBottom: "1px solid rgba(107, 79, 187, 0.2)",
                        }}
                    >
                        <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                            {selected.size} seleccionada{selected.size !== 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={() => handleBulkStatus("approved")}
                            className="rounded-md px-3 py-1 text-xs font-medium text-white transition"
                            style={{ background: "#16a34a" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#15803d"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
                        >
                            Aprobar seleccionados
                        </button>
                        <button
                            onClick={() => handleBulkStatus("rejected")}
                            className="rounded-md px-3 py-1 text-xs font-medium text-white transition"
                            style={{ background: "#dc2626" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#b91c1c"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#dc2626"; }}
                        >
                            Rechazar seleccionados
                        </button>
                        <button
                            onClick={() => handleBulkStatus("pending")}
                            className="rounded-md px-3 py-1 text-xs font-medium transition"
                            style={{
                                background: "var(--color-panel-bg)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            Marcar pendiente
                        </button>
                        <button
                            onClick={() => setSelected(new Set())}
                            className="ml-auto text-xs transition"
                            style={{ color: "var(--color-text-muted)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                        >
                            Deseleccionar
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-border-subtle)" }}>
                                <th className="w-10 px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={allFilteredSelected}
                                        onChange={toggleSelectAll}
                                        className="h-3.5 w-3.5 rounded"
                                        style={{ accentColor: "var(--color-accent)" }}
                                    />
                                </th>
                                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Fecha
                                </th>
                                <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Descripción
                                </th>
                                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Monto
                                </th>
                                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Tipo
                                </th>
                                <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Categoría
                                </th>
                                <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Subcategoría
                                </th>
                                <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Estado
                                </th>
                                <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-12 text-center text-sm"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        {transactions.length === 0
                                            ? "No hay transacciones este mes. Carga un estado de cuenta para comenzar."
                                            : "No hay resultados para los filtros seleccionados."}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <TransactionRow
                                        key={t.id}
                                        transaction={t}
                                        categories={categories}
                                        subcategories={subcategories}
                                        isSelected={selected.has(t.id)}
                                        onToggle={() => toggleOne(t.id)}
                                        onStatusChange={(status) =>
                                            handleSingleStatus(t.id, status)
                                        }
                                        onCategoryChange={(catId) =>
                                            handleCategoryChange(t.id, catId)
                                        }
                                        onSubcategoryChange={(subId) =>
                                            handleSubcategoryChange(t.id, subId)
                                        }
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                        style={{
                            borderTop: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        <span>
                            Mostrando{" "}
                            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                                {filtered.length}
                            </span>{" "}
                            de{" "}
                            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                                {transactions.length}
                            </span>{" "}
                            transacciones
                        </span>
                        <span>
                            Total filtrado:{" "}
                            <span
                                className="font-semibold"
                                style={{ color: filteredTotal >= 0 ? "var(--color-text-primary)" : "#16a34a" }}
                            >
                                S/ {formatAmount(Math.abs(filteredTotal))}
                            </span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    valueStyle,
    bgStyle,
}: {
    label: string;
    value: string;
    valueStyle: React.CSSProperties;
    bgStyle: React.CSSProperties;
}) {
    return (
        <div className="rounded-lg px-4 py-3" style={bgStyle}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            <p className="mt-1 text-lg font-bold" style={valueStyle}>{value}</p>
        </div>
    );
}

function TransactionRow({
    transaction: t,
    categories,
    subcategories,
    isSelected,
    onToggle,
    onStatusChange,
    onCategoryChange,
    onSubcategoryChange,
}: {
    transaction: Transaction;
    categories: Category[];
    subcategories: Subcategory[];
    isSelected: boolean;
    onToggle: () => void;
    onStatusChange: (status: "approved" | "rejected" | "pending") => void;
    onCategoryChange: (categoryId: string) => void;
    onSubcategoryChange: (subcategoryId: string | null) => void;
}) {
    return (
        <tr
            className="group transition"
            style={{
                background: isSelected ? "rgba(107, 79, 187, 0.06)" : "transparent",
                borderBottom: "1px solid var(--color-border-subtle)",
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-border-subtle)";
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }
            }}
        >
            {/* Checkbox */}
            <td className="px-4 py-2.5">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="h-3.5 w-3.5 rounded"
                    style={{ accentColor: "var(--color-accent)" }}
                />
            </td>

            {/* Date */}
            <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {formatDate(t.date)}
            </td>

            {/* Description */}
            <td className="px-3 py-2.5">
                <div className="max-w-xs">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {t.description}
                    </p>
                    {t.card && (
                        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                            {t.card.name}
                            {t.card.last_four ? ` •••• ${t.card.last_four}` : ""}
                        </p>
                    )}
                </div>
            </td>

            {/* Amount */}
            <td className="whitespace-nowrap px-3 py-2.5">
                <span
                    className="text-sm font-semibold"
                    style={{ color: t.type === "abono" ? "#16a34a" : "#dc2626" }}
                >
                    {t.type === "abono" ? "+" : "−"} S/ {formatAmount(Number(t.amount))}
                </span>
            </td>

            {/* Type badge */}
            <td className="px-3 py-2.5">
                <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={
                        t.type === "abono"
                            ? { background: "#d1fae5", color: "#065f46" }
                            : { background: "#fee2e2", color: "#991b1b" }
                    }
                >
                    {t.type === "abono" ? "Abono" : "Gasto"}
                </span>
            </td>

            {/* Category */}
            <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                    {t.category && (
                        <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.category.color }}
                        />
                    )}
                    <select
                        value={t.category_id ?? ""}
                        onChange={(e) => {
                            if (e.target.value)
                                onCategoryChange(e.target.value);
                        }}
                        className="rounded py-0 pl-0 pr-6 text-xs focus:ring-0 cursor-pointer"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        <option value="">Sin categoría</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </td>

            {/* Subcategory */}
            <td className="px-3 py-2.5">
                {t.category_id ? (
                    <select
                        value={t.subcategory_id ?? ""}
                        onChange={(e) => onSubcategoryChange(e.target.value || null)}
                        className="rounded py-0 pl-0 pr-6 text-xs focus:ring-0 cursor-pointer"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        <option value="">—</option>
                        {subcategories
                            .filter((s) => s.category_id === t.category_id)
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                    </select>
                ) : (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                )}
            </td>

            {/* Status badge */}
            <td className="px-3 py-2.5">
                <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={STATUS_STYLES[t.status]}
                >
                    {STATUS_LABELS[t.status]}
                </span>
            </td>

            {/* Actions */}
            <td className="px-3 py-2.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {t.status !== "approved" && (
                        <ActionButton
                            onClick={() => onStatusChange("approved")}
                            title="Aprobar"
                            hoverBg="#f0fdf4"
                            color="#16a34a"
                        >
                            ✓
                        </ActionButton>
                    )}
                    {t.status !== "rejected" && (
                        <ActionButton
                            onClick={() => onStatusChange("rejected")}
                            title="Rechazar"
                            hoverBg="#fef2f2"
                            color="#dc2626"
                        >
                            ✗
                        </ActionButton>
                    )}
                    {t.status !== "pending" && (
                        <ActionButton
                            onClick={() => onStatusChange("pending")}
                            title="Revertir a pendiente"
                            hoverBg="var(--color-border-subtle)"
                            color="var(--color-text-secondary)"
                        >
                            ↺
                        </ActionButton>
                    )}
                </div>
            </td>
        </tr>
    );
}

function ActionButton({
    onClick,
    title,
    color,
    hoverBg,
    children,
}: {
    onClick: () => void;
    title: string;
    color: string;
    hoverBg: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold transition"
            style={{ color }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
        >
            {children}
        </button>
    );
}
