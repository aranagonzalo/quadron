"use server";

import { createHash } from "crypto";

import { ParsedTransaction } from "@/src/lib/parsers/visa";
import { supabaseAdmin } from "@/src/lib/supabase";
import { Category, Subcategory, Transaction } from "@/src/types";

function txHash(date: string, amount: number, description: string, cardId: string): string {
    return createHash("sha256")
        .update(`${date}|${amount}|${description}|${cardId}`)
        .digest("hex");
}

export async function getTransactions(
    userId: string,
    month: number,
    year: number,
): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
        .from("transactions")
        .select(
            `
      *,
      card:cards(*),
      category:categories(*),
      subcategory:subcategories(*)
    `,
        )
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year)
        .order("date", { ascending: false });
    if (error) {
        console.error("getTransactions error:", error);
        return [];
    }

    return (data ?? []) as Transaction[];
}

export async function getSubcategories(): Promise<Subcategory[]> {
    const { data, error } = await supabaseAdmin
        .from("subcategories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("getSubcategories error:", error);
        return [];
    }

    return data ?? [];
}

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("getCategories error:", error);
        return [];
    }

    return data ?? [];
}

export async function saveTransactions(
    transactions: ParsedTransaction[],
    userId: string,
    cardId: string,
): Promise<{ inserted: number; skipped: number }> {
    if (transactions.length === 0) return { inserted: 0, skipped: 0 };

    // Compute hashes for all candidates
    const candidates = transactions.map((t) => ({
        ...t,
        hash: txHash(t.date, t.amount, t.description, cardId),
    }));

    // Fetch only existing hashes — single indexed column, no full table scan
    const { data: existing } = await supabaseAdmin
        .from("transactions")
        .select("tx_hash")
        .eq("user_id", userId)
        .in("tx_hash", candidates.map((c) => c.hash));

    const existingHashes = new Set((existing ?? []).map((r) => r.tx_hash));

    const toInsert = candidates.filter((c) => !existingHashes.has(c.hash));

    if (toInsert.length === 0) {
        return { inserted: 0, skipped: transactions.length };
    }

    const rows = toInsert.map((t) => ({
        user_id: userId,
        card_id: cardId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        month: t.month,
        year: t.year,
        status: "pending",
        tx_hash: t.hash,
    }));

    const { error } = await supabaseAdmin.from("transactions").insert(rows);

    if (error) {
        console.error("saveTransactions error:", error);
        throw new Error(error.message);
    }

    return {
        inserted: toInsert.length,
        skipped: transactions.length - toInsert.length,
    };
}

export async function updateStatus(
    ids: string[],
    status: "approved" | "rejected" | "pending",
): Promise<boolean> {
    if (ids.length === 0) return true;

    const { error } = await supabaseAdmin
        .from("transactions")
        .update({ status })
        .in("id", ids);

    if (error) {
        console.error("updateStatus error:", error);
        return false;
    }

    return true;
}

export async function updateCategory(
    id: string,
    categoryId: string,
): Promise<boolean> {
    // Clear subcategory when category changes
    const { error } = await supabaseAdmin
        .from("transactions")
        .update({ category_id: categoryId, subcategory_id: null })
        .eq("id", id);

    if (error) {
        console.error("updateCategory error:", error);
        return false;
    }

    return true;
}

export async function createTransaction(payload: {
    user_id: string;
    card_id: string | null;
    date: string;
    description: string;
    amount: number;
    type: "gasto" | "abono";
    category_id: string | null;
    subcategory_id: string | null;
    month: number;
    year: number;
}): Promise<Transaction> {
    const hash = txHash(
        payload.date,
        payload.amount,
        payload.description,
        payload.card_id ?? "efectivo",
    );

    const { data, error } = await supabaseAdmin
        .from("transactions")
        .insert({ ...payload, status: "approved", tx_hash: hash })
        .select(`*, card:cards(*), category:categories(*), subcategory:subcategories(*)`)
        .single();

    if (error) {
        console.error("createTransaction error:", error);
        throw new Error(error.message);
    }

    return data as Transaction;
}

export async function updateSubcategory(
    id: string,
    subcategoryId: string | null,
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from("transactions")
        .update({ subcategory_id: subcategoryId })
        .eq("id", id);

    if (error) {
        console.error("updateSubcategory error:", error);
        return false;
    }

    return true;
}
