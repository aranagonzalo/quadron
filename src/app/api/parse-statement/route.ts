export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PDFExtract } from "pdf.js-extract";

import {
    isSavingsFormat,
    parseSavingsItems,
    PDFItem,
} from "@/src/lib/parsers/savings";
import { parseVisaText } from "@/src/lib/parsers/visa";

async function extractPDFItems(
    buffer: Buffer,
    password: string,
): Promise<PDFItem[]> {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(buffer, { password });

    const allItems: PDFItem[] = [];
    for (const page of data.pages || []) {
        for (const item of page.content || []) {
            if (!item.str?.trim()) continue;
            allItems.push({
                str: item.str,
                x: Math.round(item.x),
                y: Math.round(item.y),
            });
        }
    }
    return allItems;
}

function err422(message: string) {
    return NextResponse.json({ error: message }, { status: 422 });
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

        const buffer = Buffer.from(await file.arrayBuffer());

        // Phase 1: attempt without password to determine if PDF is encrypted.
        // If this succeeds the PDF is not encrypted (or password is ignored).
        // If it throws, the PDF requires a password.
        let items: PDFItem[];
        let isEncrypted = false;

        try {
            items = await extractPDFItems(buffer, "");
        } catch {
            isEncrypted = true;
            items = [];
        }

        if (isEncrypted) {
            if (!password) {
                return err422("El PDF está protegido. Ingresa la contraseña.");
            }
            // Phase 2: try with the provided password.
            try {
                items = await extractPDFItems(buffer, password);
            } catch {
                return err422("Contraseña incorrecta.");
            }
            // Some implementations return empty content instead of throwing on wrong password.
            if (items.length === 0) {
                return err422("Contraseña incorrecta.");
            }
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
