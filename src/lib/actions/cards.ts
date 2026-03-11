"use server";

import { supabaseAdmin } from "@/src/lib/supabase";
import { Card } from "@/src/types";

export async function getCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCards error:", error);
    return [];
  }

  return data ?? [];
}

export async function createCard(
  userId: string,
  data: { name: string; bank: string; lastFour?: string; color: string }
): Promise<Card | null> {
  const { data: card, error } = await supabaseAdmin
    .from("cards")
    .insert({
      user_id: userId,
      name: data.name,
      bank: data.bank,
      last_four: data.lastFour ?? null,
      color: data.color,
    })
    .select()
    .single();

  if (error) {
    console.error("createCard error:", error);
    return null;
  }

  return card;
}

export async function deleteCard(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("cards")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteCard error:", error);
    return false;
  }

  return true;
}
