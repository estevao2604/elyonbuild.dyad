import { supabase } from "./client";

// Unsafe helper to bypass temporary typing issues from generated Database types
// Use sb.from("table") exactly like supabase.from, but untyped
export const sb: any = supabase;
