// Γρήγορη είσοδος: 4ψήφιο PIN, και προαιρετικά Face ID / δακτυλικό, ανά συσκευή.
//
// Το PIN κρίνεται στον SERVER. Στη συσκευή μένει μόνο ένα αναγνωριστικό — τίποτα εκμεταλλεύσιμο αν
// κλαπεί. Το κλείδωμα μετά από αποτυχίες ζει στη βάση, οπότε δεν παρακάμπτεται με καθάρισμα του
// browser ούτε με δοκιμές από άλλη συσκευή. Και η αποσύνδεση δεν χαλάει τίποτα, γιατί δεν φυλάμε
// συνεδρία που να μπορεί να ακυρωθεί.
//
// Το Face ID παραμένει τοπικό, γιατί έτσι δουλεύει ο browser: φυλάει το PIN κλειδωμένο με κλειδί
// AES-GCM που ζει στην IndexedDB ως non-extractable, και το ξεκλειδώνει μόνο μετά από επιτυχή
// βιομετρική επαλήθευση. Ακόμα κι αν κάποιος το άρπαζε, θα έπεφτε πάνω στο κλείδωμα του server.

import { supabase } from './supabase'

const LS = 'gnc-quick-v2'
const DB = 'gnc-quick', STORE = 'keys', KEY_ID = 'device'

interface Vault { device: string; email: string; bio?: { id: string; iv: string; ct: string } }

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n))

const read = (): Vault | null => {
  try { const raw = localStorage.getItem(LS); return raw ? JSON.parse(raw) as Vault : null } catch { return null }
}
const write = (v: Vault | null) => {
  try { if (v) localStorage.setItem(LS, JSON.stringify(v)); else localStorage.removeItem(LS) } catch { /* private mode */ }
}

// ---------- κλειδί συσκευής (IndexedDB, non-extractable) ----------
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE) }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error ?? new Error('IndexedDB'))
  })
}
function idbGet(db: IDBDatabase, k: string): Promise<CryptoKey | undefined> {
  return new Promise((res, rej) => { const r = db.transaction(STORE).objectStore(STORE).get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
}
function idbPut(db: IDBDatabase, k: string, v: CryptoKey): Promise<void> {
  return new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
}
async function deviceKey(create: boolean): Promise<CryptoKey | null> {
  const db = await idb()
  const found = await idbGet(db, KEY_ID)
  if (found) return found
  if (!create) return null
  const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await idbPut(db, KEY_ID, k)
  return k
}

const fn = () => { if (!supabase) throw new Error('Δεν έχει ρυθμιστεί το Supabase.'); return supabase }

// ---------- δημόσιο API ----------
export const quickSupported = () => typeof localStorage !== 'undefined' && !!supabase
export const hasQuick = () => !!read()
export const quickEmail = () => read()?.email ?? null
export const hasBio = () => !!read()?.bio

export function clearQuick() { write(null) }

/** Καταχώριση PIN για αυτή τη συσκευή. Απαιτεί ενεργή συνεδρία — ο server δένει το PIN στον χρήστη. */
export async function enrolPin(pin: string, email: string): Promise<string | null> {
  if (!/^\d{4}$/.test(pin)) return 'Το PIN θέλει ακριβώς 4 ψηφία.'
  if (/^(\d)\1{3}$/.test(pin)) return 'Διάλεξε PIN που δεν είναι τέσσερα ίδια ψηφία.'
  try {
    const label = typeof navigator !== 'undefined' ? navigator.platform || 'Συσκευή' : 'Συσκευή'
    const { data, error } = await fn().functions.invoke('device-pin', { body: { action: 'enrol', pin, label } })
    if (error) return (data as { error?: string })?.error ?? error.message
    const device = (data as { device?: string })?.device
    if (!device) return 'Δεν ήταν δυνατή η καταχώριση.'
    write({ device, email })
    return null
  } catch (e) { return (e as Error).message }
}

/** Ξεκλείδωμα με PIN. Επιστρέφει το token που εξαργυρώνεται σε κανονική συνεδρία. */
export async function unlockWithPin(pin: string): Promise<{ tokenHash?: string; error?: string }> {
  const v = read(); if (!v) return { error: 'Δεν υπάρχει γρήγορη είσοδος σε αυτή τη συσκευή.' }
  try {
    const { data, error } = await fn().functions.invoke('device-pin', { body: { action: 'unlock', device: v.device, pin } })
    const body = data as { token_hash?: string; error?: string; left?: number } | null
    if (error || !body?.token_hash) {
      const msg = body?.error ?? 'Λάθος PIN'
      return { error: body?.left != null ? `${msg}. Απομένουν ${body.left} προσπάθειες.` : msg }
    }
    return { tokenHash: body.token_hash }
  } catch (e) { return { error: (e as Error).message } }
}

// ---------- Face ID / δακτυλικό (WebAuthn, platform authenticator) ----------
export async function bioSupported(): Promise<boolean> {
  try {
    if (!globalThis.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

/** Δένει βιομετρικό διαπιστευτήριο και φυλάει το PIN κλειδωμένο πίσω του. Θέλει το PIN μία φορά. */
export async function enableBio(email: string, pin: string): Promise<string | null> {
  const v = read(); if (!v) return 'Όρισε πρώτα PIN.'
  if (!/^\d{4}$/.test(pin)) return 'Βάλε το PIN σου για επιβεβαίωση.'
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: 'GNC 3on3', id: location.hostname },
        user: { id: rand(16), name: email, displayName: email },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60_000, attestation: 'none',
      },
    }) as PublicKeyCredential | null
    if (!cred) return 'Ακυρώθηκε.'
    const key = await deviceKey(true); if (!key) return 'Η συσκευή δεν υποστηρίζει ασφαλή αποθήκευση.'
    const iv = rand(12)
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(pin))
    write({ ...read()!, bio: { id: b64(cred.rawId), iv: b64(iv), ct: b64(ct) } })
    return null
  } catch (e) {
    const err = e as Error
    return err.name === 'NotAllowedError' ? 'Ακυρώθηκε ή έληξε ο χρόνος.' : err.message
  }
}

export function disableBio() { const v = read(); if (v) write({ ...v, bio: undefined }) }

export async function unlockWithBio(): Promise<{ tokenHash?: string; error?: string }> {
  const v = read(); if (!v?.bio) return { error: 'Δεν έχει ενεργοποιηθεί βιομετρική είσοδος.' }
  try {
    const got = await navigator.credentials.get({
      publicKey: {
        challenge: rand(32), rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: unb64(v.bio.id) as BufferSource }],
        userVerification: 'required', timeout: 60_000,
      },
    }) as PublicKeyCredential | null
    if (!got) return { error: 'Ακυρώθηκε.' }
    const key = await deviceKey(false)
    if (!key) { disableBio(); return { error: 'Το κλειδί της συσκευής δεν βρέθηκε. Μπες με PIN.' } }
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.bio.iv) as BufferSource }, key, unb64(v.bio.ct) as BufferSource)
    return await unlockWithPin(new TextDecoder().decode(plain))
  } catch (e) {
    const err = e as Error
    return { error: err.name === 'NotAllowedError' ? 'Ακυρώθηκε ή έληξε ο χρόνος.' : err.message }
  }
}
