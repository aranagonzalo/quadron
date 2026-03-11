"use server";

import { ParsedTransaction } from "@/src/lib/parsers/visa";
import { supabaseAdmin } from "@/src/lib/supabase";
import { Category, Transaction } from "@/src/types";

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
      category:categories(*)
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

    // Fetch existing transactions for this user+card to detect duplicates
    const { data: existing } = await supabaseAdmin
        .from("transactions")
        .select("date, description, amount, card_id")
        .eq("user_id", userId)
        .eq("card_id", cardId);

    const existingSet = new Set(
        (existing ?? []).map(
            (t) => `${t.date}|${t.description}|${t.amount}|${t.card_id}`,
        ),
    );

    const toInsert = transactions.filter((t) => {
        const key = `${t.date}|${t.description}|${t.amount}|${cardId}`;
        return !existingSet.has(key);
    });

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
    const { error } = await supabaseAdmin
        .from("transactions")
        .update({ category_id: categoryId })
        .eq("id", id);

    if (error) {
        console.error("updateCategory error:", error);
        return false;
    }

    return true;
}
