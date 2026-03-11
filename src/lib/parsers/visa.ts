export interface ParsedTransaction {
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    type: "gasto" | "abono";
    month: number;
    year: number;
}

const MONTH_MAP: Record<string, number> = {
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

const MONTH_ABBREVS = Object.keys(MONTH_MAP).join("|");

function parseShortDate(raw: string): { day: number; month: number } | null {
    const m = raw.match(new RegExp(`^(\\d{2})(${MONTH_ABBREVS})$`, "i"));
    if (!m) return null;
    const month = MONTH_MAP[m[2].toLowerCase()];
    return month ? { day: parseInt(m[1], 10), month } : null;
}

// Extract the statement year by finding the first DD/MM/YY(YY) date in the document
function extractYear(text: string): number {
    const matches = [...text.matchAll(/\b\d{2}\/\d{2}\/(\d{2,4})\b/g)];
    for (const m of matches) {
        const y = parseInt(m[1], 10);
        const fullYear = y < 100 ? 2000 + y : y;
        if (fullYear >= 2020) return fullYear;
    }
    return new Date().getFullYear();
}

// Transaction type keywords (Tipo de Operación column in BCP VISA)
const TYPE_KEYWORDS = ["CONSUMO", "PAGO", "RETIRO", "CARGO", "ABONO", "DEVOLUCION", "CREDITO"];

// Keywords that mark a transaction as income/credit
const ABONO_KEYWORDS = ["PAGO", "ABONO", "DEVOLUCION", "CREDITO", "REEMBOLSO"];

// Lines that are clearly not transactions
const SKIP_KEYWORDS = [
    "SALDO ANTERIOR", "INTERESES", "COMISION", "SUB TOTAL", "SUBTOTAL",
    "TOTAL FACTURADO", "MONTO TOTAL", "GASTO MENSUAL", "SEGURO", "MEMBRESIA",
    "ENVIO FISICO",
];

export function parseVisaText(text: string): ParsedTransaction[] {
    const year = extractYear(text);
    const results: ParsedTransaction[] = [];

    // BCP VISA format: DDMes DDMes DESCRIPTION... TIPO_KEYWORD  amount
    // Example: "15Ene 14Ene DLC*PEDIDOSYA ENVIOS MAGDALENA DEL PE CONSUMO 10.90"
    const typePattern = TYPE_KEYWORDS.join("|");
    const datePattern = `\\d{2}(?:${MONTH_ABBREVS})`;

    const regex = new RegExp(
        `(${datePattern})\\s+(${datePattern})\\s+(.+?)\\s+(${typePattern})\\s+([\\d,]+\\.\\d{2})(?!-)`,
        "gi"
    );

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        const [fullMatch, , consumptionDateRaw, rawDesc, typeKeyword, amountStr] = match;

        // Skip totals/fees that accidentally match the pattern
        const upperDesc = rawDesc.toUpperCase();
        if (SKIP_KEYWORDS.some((k) => upperDesc.includes(k))) continue;
        // Skip negative amounts (credits shown as "305.90-")
        const afterMatch = text.slice(match.index + fullMatch.length);
        if (afterMatch.startsWith("-")) continue;

        const dateInfo = parseShortDate(consumptionDateRaw);
        if (!dateInfo) continue;

        const amount = parseFloat(amountStr.replace(",", ""));
        if (isNaN(amount) || amount <= 0) continue;

        const description = rawDesc.replace(/\s+/g, " ").trim().toUpperCase();
        if (!description || description.length < 3) continue;

        const isAbono =
            ABONO_KEYWORDS.some((k) => typeKeyword.toUpperCase().includes(k)) ||
            ABONO_KEYWORDS.some((k) => description.includes(k));

        const type: "gasto" | "abono" = isAbono ? "abono" : "gasto";

        // If transaction month is in Q4 (Oct-Dec) but statement is in Q1 (Jan-Mar), it's previous year
        const statementMonth = new Date().getMonth() + 1;
        const txYear =
            dateInfo.month >= 10 && statementMonth <= 3 ? year - 1 : year;

        const date = `${txYear}-${String(dateInfo.month).padStart(2, "0")}-${String(dateInfo.day).padStart(2, "0")}`;

        results.push({ date, description, amount, type, month: dateInfo.month, year: txYear });
    }

    return results;
}
