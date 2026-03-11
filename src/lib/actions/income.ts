"use server";

import { supabaseAdmin } from "@/src/lib/supabase";
import { IncomeSource } from "@/src/types";

export async function getIncomeSources(
    userId: string,
    month: number,
    year: number,
): Promise<IncomeSource[]> {
    const { data, error } = await supabaseAdmin
        .from("income_sources")
        .select("*")
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("getIncomeSources error:", error);
        return [];
    }

    return data ?? [];
}

export async function createIncomeSource(payload: {
    user_id: string;
    month: number;
    year: number;
    name: string;
    amount: number;
}): Promise<IncomeSource> {
    const { data, error } = await supabaseAdmin
        .from("income_sources")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        console.error("createIncomeSource error:", error);
        throw new Error(error.message);
    }

    return data as IncomeSource;
}

export async function updateIncomeSource(
    id: string,
    name: string,
    amount: number,
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from("income_sources")
        .update({ name, amount })
        .eq("id", id);

    if (error) {
        console.error("updateIncomeSource error:", error);
        return false;
    }

    return true;
}

export async function deleteIncomeSource(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from("income_sources")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("deleteIncomeSource error:", error);
        return false;
    }

    return true;
}
