export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import path from "path";

import {
    isSavingsFormat,
    parseSavingsItems,
    PDFItem,
} from "@/src/lib/parsers/savings";
import { parseVisaText } from "@/src/lib/parsers/visa";

async function extractPDFItems(
    buffer: Uint8Array,
    password?: string,
): Promise<PDFItem[]> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerPath = path.resolve(
        "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

    const pdf = await pdfjsLib.getDocument({
        data: buffer,
        password: password || "",
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0,
    }).promise;

    const allItems: PDFItem[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        for (const item of content.items) {
            if (!("str" in item) || !item.str.trim()) continue;
            allItems.push({
                str: item.str,
                x: Math.round((item as { transform: number[] }).transform[4]),
                y: Math.round((item as { transform: number[] }).transform[5]),
            });
        }
    }

    return allItems;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const password = (formData.get("password") as string) || "";

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json(
                { error: "El archivo debe ser un PDF." },
                { status: 400 },
            );
        }

        const uint8Array = new Uint8Array(await file.arrayBuffer());

        let items: PDFItem[];
        try {
            items = await extractPDFItems(uint8Array, password);
        } catch (err: unknown) {
            const name = (err as Record<string, unknown>)?.name;
            const code = (err as Record<string, unknown>)?.code;
            const msg = err instanceof Error ? err.message : String(err);
            const isPasswordError =
                name === "PasswordException" ||
                code === 1 ||
                code === 2 ||
                msg.toLowerCase().includes("password") ||
                msg.toLowerCase().includes("incorrect password");
            if (isPasswordError) {
                return NextResponse.json(
                    {
                        error:
                            code === 2 || msg.includes("Incorrect")
                                ? "Contraseña incorrecta."
                                : "El PDF está protegido. Ingresa la contraseña.",
                    },
                    { status: 200 },
                );
            }
            throw err;
        }

        if (items.length === 0) {
            return NextResponse.json(
                {
                    error: "No se pudo extraer texto del PDF. Puede ser un PDF de imágenes.",
                    transactions: [],
                },
                { status: 200 },
            );
        }

        // Detect format and use the appropriate parser
        let transactions;
        if (isSavingsFormat(items)) {
            transactions = parseSavingsItems(items);
        } else {
            const text = items.map((i) => i.str).join(" ");
            transactions = parseVisaText(text);
        }

        return NextResponse.json({ transactions, total: transactions.length });
    } catch (err) {
        console.error("parse-statement error:", err);
        return NextResponse.json(
            { error: "Error procesando el archivo." },
            { status: 500 },
        );
    }
}
