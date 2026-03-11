"use client";

import { DragEvent, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveTransactions } from "@/src/lib/actions/transactions";
import { ParsedTransaction } from "@/src/lib/parsers/visa";
import { Card } from "@/src/types";

interface Props {
    cards: Card[];
    userId: string;
    onImported: (count: number) => void;
}

export default function UploadStatement({ cards, userId, onImported }: Props) {
    const [isPending, startTransition] = useTransition();
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string>(
        cards[0]?.id ?? "",
    );
    const [password, setPassword] = useState("");

    useEffect(() => {
        setSelectedCardId((prev) => prev || cards[0]?.id || "");
    }, [cards]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
    }

    function handleSubmit() {
        if (!selectedFile) {
            toast.error("Selecciona un archivo PDF.");
            return;
        }
        if (!selectedCardId) {
            toast.error("Selecciona una tarjeta.");
            return;
        }

        const toastId = toast.loading("Procesando estado de cuenta...");

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);
                if (password) formData.append("password", password);

                const res = await fetch("/api/parse-statement", {
                    method: "POST",
                    body: formData,
                });

                const json = await res.json();

                if (!res.ok) {
                    toast.error(json.error ?? "Error al procesar el PDF.", {
                        id: toastId,
                    });
                    return;
                }

                const parsed: ParsedTransaction[] = json.transactions ?? [];

                if (parsed.length === 0) {
                    toast.warning(
                        "No se encontraron transacciones. Verifica el formato del PDF.",
                        { id: toastId },
                    );
                    return;
                }

                const { inserted, skipped } = await saveTransactions(
                    parsed,
                    userId,
                    selectedCardId,
                );

                toast.success(
                    `${inserted} transacciones importadas${skipped > 0 ? ` (${skipped} duplicadas omitidas)` : ""}.`,
                    { id: toastId },
                );
                setSelectedFile(null);
                setPassword("");
                if (fileInputRef.current) fileInputRef.current.value = "";
                onImported(inserted);
            } catch (err) {
                console.error(err);
                toast.error("Error inesperado al cargar.", { id: toastId });
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
        <div
            className="rounded-lg p-4 space-y-4"
            style={{
                background: "var(--color-panel-bg)",
                border: "1px solid var(--color-border)",
            }}
        >
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Cargar estado de cuenta (PDF)
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Drop zone */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="col-span-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition"
                    style={{
                        borderColor: isDragging ? "var(--color-accent)" : "var(--color-border)",
                        background: isDragging ? "rgba(107, 79, 187, 0.06)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                        if (!isDragging) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
                            (e.currentTarget as HTMLDivElement).style.background = "rgba(107, 79, 187, 0.04)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isDragging) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                            (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        }
                    }}
                >
                    <span className="text-2xl mb-1">📄</span>
                    {selectedFile ? (
                        <p className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                            {selectedFile.name}
                        </p>
                    ) : (
                        <>
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Arrastra tu PDF aquí
                            </p>
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                o haz clic para seleccionar
                            </p>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Options */}
                <div className="space-y-2">
                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Tarjeta
                        </label>
                        <select
                            value={selectedCardId}
                            onChange={(e) => setSelectedCardId(e.target.value)}
                            style={inputStyle}
                        >
                            {cards.length === 0 ? (
                                <option value="">Sin tarjetas</option>
                            ) : (
                                cards.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{" "}
                                        {c.last_four ? `•••• ${c.last_four}` : ""}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Contraseña (si aplica)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="PDF protegido"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col justify-end gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !selectedFile || cards.length === 0}
                        className="w-full rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
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
                        {isPending ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Procesando...
                            </span>
                        ) : (
                            "Cargar"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
