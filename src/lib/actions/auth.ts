"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const registerSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
});

export async function registerUser(formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) {
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: "Datos inválidos." };
    }

    const { firstName, lastName, email, password } = parsed.data;

    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

    if (existing) {
        return { error: "Ya existe una cuenta con ese email." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { error } = await supabase.from("users").insert({
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
