import type { ParsedTransaction } from "./visa";

export interface PDFItem {
    str: string;
    x: number;
    y: number;
}

const MONTH_MAP: Record<string, number> = {
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

const MONTH_ABBREVS = Object.keys(MONTH_MAP).join("|");
const DATE_RE = new RegExp(`^(\\d{2})(${MONTH_ABBREVS})$`, "i");

function parseShortDate(str: string): { day: number; month: number } | null {
    const m = str.match(DATE_RE);
    if (!m) return null;
    const month = MONTH_MAP[m[2].toLowerCase()];
    return month ? { day: parseInt(m[1], 10), month } : null;
}

function extractYear(items: PDFItem[]): number {
    // Look for DD/MM/YY patterns in the document
    for (const item of items) {
        const m = item.str.match(/\b\d{2}\/\d{2}\/(\d{2,4})\b/);
        if (m) {
            const y = parseInt(m[1], 10);
            const full = y < 100 ? 2000 + y : y;
            if (full >= 2020) return full;
        }
    }
    return new Date().getFullYear();
}

// Detect if this PDF matches the BCP savings account format
export function isSavingsFormat(items: PDFItem[]): boolean {
    const joined = items.map((i) => i.str).join(" ").toUpperCase();
    return joined.includes("CARGOS / DEBE") || joined.includes("ABONOS / HABER");
}

export function parseSavingsItems(items: PDFItem[]): ParsedTransaction[] {
    const year = extractYear(items);
    const results: ParsedTransaction[] = [];

    // Group items by row (similar Y coordinate, within 3px)
    const rows: PDFItem[][] = [];
    const usedIndices = new Set<number>();

    const sorted = [...items].sort((a, b) => b.y - a.y); // top → bottom

    for (let i = 0; i < sorted.length; i++) {
        if (usedIndices.has(i)) continue;
        const row = [sorted[i]];
        usedIndices.add(i);
        for (let j = i + 1; j < sorted.length; j++) {
            if (usedIndices.has(j)) continue;
            if (Math.abs(sorted[j].y - sorted[i].y) <= 3) {
                row.push(sorted[j]);
                usedIndices.add(j);
            }
        }
        rows.push(row.sort((a, b) => a.x - b.x)); // left → right within row
    }

    // The ABONOS column starts around x=485 (from inspecting the PDF)
    // Amounts at x < ABONO_THRESHOLD are CARGOS (gasto), >= are ABONOS (abono)
    const ABONO_X_THRESHOLD = 480;

    // Skip lines before the transaction data starts
    const SKIP_PATTERNS = [
        /^FECHA/i, /^DESCRIPCION/i, /^CARGOS/i, /^ABONOS/i,
        /^SALDO\s+ANTERIOR/i, /^TOTAL\s+MOVIMIENTO/i, /^SALDO$/i,
        /^PAGINA/i, /^MENSAJE/i, /^CODIGO/i, /^MONEDA/i,
    ];

    for (const row of rows) {
        // First item in row must be a date (DDMes)
        const firstStr = row[0]?.str?.trim() ?? "";
        const dateInfo = parseShortDate(firstStr);
        if (!dateInfo) continue;

        // Skip if row matches header/summary patterns
        const rowText = row.map((i) => i.str).join(" ");
        if (SKIP_PATTERNS.some((re) => re.test(rowText))) continue;

        // Second item should also be a date (fecha valor) — skip if not
        const secondStr = row[1]?.str?.trim() ?? "";
        if (!parseShortDate(secondStr)) continue;

        // Description: items between x=120 and x=280
        const descItems = row.filter((i) => i.x >= 120 && i.x <= 280 && i.str.trim() !== "*");
        const description = descItems.map((i) => i.str.trim()).join(" ").toUpperCase();
        if (!description) continue;

        // Find the amount item (a number, skip "*")
        const amountItem = row.find((i) => {
            const s = i.str.trim();
            return /^[\d,]+\.\d{2}$/.test(s);
        });
        if (!amountItem) continue;

        const amount = parseFloat(amountItem.str.replace(/,/g, ""));
        if (isNaN(amount) || amount <= 0) continue;

        const type: "gasto" | "abono" = amountItem.x >= ABONO_X_THRESHOLD ? "abono" : "gasto";

        // Determine year (handle Dec transactions in Jan statements)
        const statementMonth = new Date().getMonth() + 1;
        const txYear = dateInfo.month >= 10 && statementMonth <= 3 ? year - 1 : year;

        const date = `${txYear}-${String(dateInfo.month).padStart(2, "0")}-${String(dateInfo.day).padStart(2, "0")}`;

        results.push({ date, description, amount, type, month: dateInfo.month, year: txYear });
    }

    return results;
}
