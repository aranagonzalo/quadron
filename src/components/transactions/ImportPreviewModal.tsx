"use client";

import { useState } from "react";

import { ParsedTransaction } from "@/src/lib/parsers/visa";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";

const MONTH_NAMES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MonthGroup {
    key: string;
    month: number;
    year: number;
    transactions: ParsedTransaction[];
    totalGastos: number;
}

function groupByMonth(transactions: ParsedTransaction[]): MonthGroup[] {
    const map = new Map<string, MonthGroup>();
    for (const t of transactions) {
        const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
        if (!map.has(key)) {
            map.set(key, { key, month: t.month, year: t.year, transactions: [], totalGastos: 0 });
        }
        const group = map.get(key)!;
        group.transactions.push(t);
        if (t.type === "gasto") group.totalGastos += t.amount;
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

interface Props {
    open: boolean;
    transactions: ParsedTransaction[];
    onConfirm: (selected: ParsedTransaction[]) => void;
    onCancel: () => void;
}

export default function ImportPreviewModal({ open, transactions, onConfirm, onCancel }: Props) {
    const groups = groupByMonth(transactions);
    const [checkedKeys, setCheckedKeys] = useState<Set<string>>(
        () => new Set(groups.map((g) => g.key)),
    );

    // Re-sync when transactions change (new file uploaded)
    const allKeys = new Set(groups.map((g) => g.key));
    // Add any new keys that appeared
    for (const k of allKeys) {
        if (!checkedKeys.has(k) && !Array.from(checkedKeys).some((ck) => allKeys.has(ck))) {
            setCheckedKeys(allKeys);
        }
    }

    function toggle(key: string) {
        setCheckedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    const selectedTransactions = transactions.filter((t) => {
        const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
        return checkedKeys.has(key);
    });

    const totalSelected = selectedTransactions.length;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent title="Transacciones encontradas">
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                    Selecciona los meses que deseas importar.
                </p>

                <div className="space-y-2 mb-5">
                    {groups.map((g) => (
                        <label
                            key={g.key}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition"
                            style={{
                                background: checkedKeys.has(g.key)
                                    ? "rgba(107, 79, 187, 0.08)"
                                    : "var(--color-surface)",
                                border: `1px solid ${checkedKeys.has(g.key) ? "var(--color-accent)" : "var(--color-border)"}`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={checkedKeys.has(g.key)}
                                    onChange={() => toggle(g.key)}
                                    className="h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
                                />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                        {MONTH_NAMES[g.month]} {g.year}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                        {g.transactions.length} transacciones
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                                S/ {g.totalGastos.toFixed(2)}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition"
                        style={{
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(selectedTransactions)}
                        disabled={totalSelected === 0}
                        className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--color-accent)" }}
                        onMouseEnter={(e) => {
                            if (totalSelected > 0)
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                        }}
                    >
                        Importar {totalSelected} transacciones
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
