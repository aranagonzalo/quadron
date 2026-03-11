"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createTransaction } from "@/src/lib/actions/transactions";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import { Card, Category, Subcategory, Transaction } from "@/src/types";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (t: Transaction) => void;
    userId: string;
    cards: Card[];
    categories: Category[];
    subcategories: Subcategory[];
    defaultMonth: number;
    defaultYear: number;
}

const inputStyle: React.CSSProperties = {
    background: "var(--color-surface, var(--color-panel-bg))",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

export default function AddTransactionModal({
    open,
    onClose,
    onCreated,
    userId,
    cards,
    categories,
    subcategories,
    defaultMonth,
    defaultYear,
}: Props) {
    const defaultDate = (() => {
        const d = new Date();
        // If current month matches the page month, use today; otherwise use first of that month
        if (d.getFullYear() === defaultYear && d.getMonth() + 1 === defaultMonth) {
            return todayISO();
        }
        return `${defaultYear}-${String(defaultMonth).padStart(2, "0")}-01`;
    })();

    const [date, setDate] = useState(defaultDate);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"gasto" | "abono">("gasto");
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [cardId, setCardId] = useState("");
    const [loading, setLoading] = useState(false);

    const filteredSubcats = subcategories.filter((s) => s.category_id === categoryId);

    function handleCategoryChange(val: string) {
        setCategoryId(val);
        setSubcategoryId(""); // reset subcategory
    }

    function reset() {
        setDate(defaultDate);
        setDescription("");
        setAmount("");
        setType("gasto");
        setCategoryId("");
        setSubcategoryId("");
        setCardId("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const parsedAmount = parseFloat(amount.replace(",", "."));
        if (!description.trim()) return toast.error("Ingresa una descripción.");
        if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error("Monto inválido.");
        if (!date) return toast.error("Selecciona una fecha.");

        const [y, m] = date.split("-").map(Number);

        setLoading(true);
        try {
            const created = await createTransaction({
                user_id: userId,
                card_id: cardId || null,
                date,
                description: description.trim().toUpperCase(),
                amount: parsedAmount,
                type,
                category_id: categoryId || null,
                subcategory_id: subcategoryId || null,
                month: m,
                year: y,
            });

            onCreated(created);
            toast.success("Transacción registrada.");
            reset();
            onClose();
        } catch {
            toast.error("Error al guardar la transacción.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent title="Registrar transacción manual">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Type toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                        {(["gasto", "abono"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className="flex-1 py-1.5 text-xs font-semibold transition"
                                style={
                                    type === t
                                        ? {
                                            background: t === "gasto" ? "#dc2626" : "#16a34a",
                                            color: "#fff",
                                        }
                                        : {
                                            background: "transparent",
                                            color: "var(--color-text-secondary)",
                                        }
                                }
                            >
                                {t === "gasto" ? "Gasto" : "Abono / Ingreso"}
                            </button>
                        ))}
                    </div>

                    {/* Date + Amount row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Monto (S/)
                            </label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Descripción
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: MERCADO DE SURQUILLO"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Category + Subcategory row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Categoría
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Subcategoría
                            </label>
                            <select
                                value={subcategoryId}
                                onChange={(e) => setSubcategoryId(e.target.value)}
                                disabled={!categoryId || filteredSubcats.length === 0}
                                style={{ ...inputStyle, opacity: !categoryId ? 0.5 : 1 }}
                            >
                                <option value="">—</option>
                                {filteredSubcats.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Card (optional) */}
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Medio de pago
                        </label>
                        <select
                            value={cardId}
                            onChange={(e) => setCardId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Efectivo</option>
                            {cards.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}{c.last_four ? ` •••• ${c.last_four}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => { reset(); onClose(); }}
                            className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition"
                            style={{
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                            style={{ background: "var(--color-accent)" }}
                            onMouseEnter={(e) => {
                                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                            }}
                        >
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
