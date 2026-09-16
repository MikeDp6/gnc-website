import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when the env is not configured → the app runs on mock data. Only the anon/publishable key belongs here. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true } }) : null
