"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCard, deleteCard } from "@/src/lib/actions/cards";
import { Card } from "@/src/types";

const PRESET_COLORS = [
    { label: "Violeta", value: "#6b4fbb" },
    { label: "Verde", value: "#22c55e" },
    { label: "Azul", value: "#3b82f6" },
    { label: "Rojo", value: "#ef4444" },
    { label: "Naranja", value: "#f97316" },
];

const BANKS = [
    "BCP",
    "BBVA",
    "Interbank",
    "Scotiabank",
    "Banbif",
    "Pichincha",
    "Otro",
];

interface Props {
    cards: Card[];
    userId: string;
    onCardsChange: (cards: Card[]) => void;
}

export default function CardManager({ cards, userId, onCardsChange }: Props) {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: "",
        bank: "BCP",
        lastFour: "",
        color: "#6b4fbb",
    });

    function handleInput(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleAdd() {
        if (!form.name.trim()) {
            toast.error("El nombre de la tarjeta es requerido.");
            return;
        }
        startTransition(async () => {
            const card = await createCard(userId, {
                name: form.name.trim(),
                bank: form.bank,
                lastFour: form.lastFour.trim() || undefined,
                color: form.color,
            });
            if (card) {
                onCardsChange([...cards, card]);
                setForm({
                    name: "",
                    bank: "BCP",
                    lastFour: "",
                    color: "#6b4fbb",
                });
                setShowForm(false);
                toast.success(`Tarjeta "${card.name}" creada.`);
            } else {
                toast.error("No se pudo crear la tarjeta.");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        startTransition(async () => {
            const ok = await deleteCard(id);
            if (ok) {
                onCardsChange(cards.filter((c) => c.id !== id));
                toast.success(`Tarjeta "${name}" eliminada.`);
            } else {
                toast.error("No se pudo eliminar la tarjeta.");
            }
        });
    }

    const inputStyle: React.CSSProperties = {
        background: "var(--color-panel-bg)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "13px",
        width: "100%",
        outline: "none",
    };

    return (
        <div className="space-y-3">
            {cards.length === 0 && !showForm && (
                <p className="py-2 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No hay tarjetas registradas.
                </p>
            )}

            <ul className="space-y-2">
                {cards.map((card) => (
                    <li
                        key={card.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{
                            background: "var(--color-canvas-bg)",
                            border: "1px solid var(--color-border)",
                        }}
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: card.color }}
                            />
                            <div>
                                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                    {card.name}
                                </p>
                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    {card.bank}
                                    {card.last_four ? ` •••• ${card.last_four}` : ""}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(card.id, card.name)}
                            disabled={isPending}
                            className="rounded p-1 transition"
                            style={{ color: "var(--color-text-muted)" }}
                            title="Eliminar"
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                                (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>

            {showForm ? (
                <div
                    className="rounded-lg p-3 space-y-3"
                    style={{
                        background: "var(--color-canvas-bg)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                        Nueva tarjeta
                    </p>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej. Visa BCP)"
                            value={form.name}
                            onChange={(e) => handleInput("name", e.target.value)}
                            style={inputStyle}
                        />
                        <select
                            value={form.bank}
                            onChange={(e) => handleInput("bank", e.target.value)}
                            style={inputStyle}
                        >
                            {BANKS.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Últimos 4 dígitos (opcional)"
                            value={form.lastFour}
                            maxLength={4}
                            onChange={(e) =>
                                handleInput("lastFour", e.target.value.replace(/\D/g, ""))
                            }
                            style={inputStyle}
                        />
                        <div>
                            <p className="mb-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                Color
                            </p>
                            <div className="flex gap-2">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => handleInput("color", c.value)}
                                        title={c.label}
                                        className={`h-6 w-6 rounded-full ring-offset-1 transition ${form.color === c.value ? "ring-2 ring-gray-500" : ""}`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={isPending}
                            className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-50"
                            style={{ background: "var(--color-accent)" }}
                            onMouseEnter={(e) => {
                                if (!isPending) {
                                    (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
                            }}
                        >
                            {isPending ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 rounded-md px-3 py-1.5 text-sm transition"
                            style={{
                                background: "var(--color-panel-bg)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-secondary)",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-panel-bg)";
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full rounded-md border-2 border-dashed px-3 py-2 text-sm transition"
                    style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-secondary)",
                        background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
                    }}
                >
                    + Agregar tarjeta
                </button>
            )}
        </div>
    );
}
