// Γρήγορη είσοδος: 4ψήφιο PIN ή Face ID / δακτυλικό, ανά συσκευή.
//
// Ένα 4ψήφιο PIN έχει 10.000 συνδυασμούς — δεν γίνεται να είναι κωδικός προς τον server. Άρα δεν
// στέλνεται πουθενά. Η συνεδρία κλειδώνεται εδώ, στη συσκευή, με κλειδί AES-GCM που φτιάχνεται μία
// φορά και ζει στην IndexedDB ως non-extractable: ο browser δεν επιτρέπει ούτε στον δικό μας κώδικα
// να το διαβάσει, μόνο να κρυπτογραφεί μ' αυτό, και μόνο από αυτό το origin. Όποιος αντιγράψει το
// localStorage παίρνει ακαταλαβίστικα.
//
// Το PIN και το Face ID είναι η πύλη: ελέγχονται τοπικά πριν ξεκλειδώσουμε. Προστατεύουν από κάποιον
// που πήρε το ξεκλείδωτο κινητό στα χέρια του — όχι από κάποιον που τρέχει κώδικα στο origin μας,
// αλλά αυτός έχει έτσι κι αλλιώς τη ζωντανή συνεδρία. Πέντε λάθος PIN σβήνουν τα πάντα.
//
// Η ανανέωση των tokens γίνεται με το κλειδί συσκευής μόνο, χωρίς PIN, ώστε το αποθηκευμένο refresh
// token να μη μένει ποτέ πίσω όταν το Supabase το περιστρέφει.

const LS = 'gnc-quick-v1'
const DB = 'gnc-quick', STORE = 'keys', KEY_ID = 'device'
const ITER = 210_000
const MAX_TRIES = 5

export interface QuickTokens { access_token: string; refresh_token: string }
interface Vault {
  email: string
  iv: string
  ct: string
  pin: { salt: string; hash: string; iter: number }
  bio?: { id: string }
  tries: number
}

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

async function pinHash(pin: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' }, base, 256)
  return b64(bits)
}

export const quickSupported = () => typeof indexedDB !== 'undefined' && !!globalThis.crypto?.subtle && typeof localStorage !== 'undefined'
export const hasQuick = () => !!read()
export const quickEmail = () => read()?.email ?? null
export const hasBio = () => !!read()?.bio
export const triesLeft = () => { const v = read(); return v ? Math.max(0, MAX_TRIES - v.tries) : MAX_TRIES }

/** Το κλειδί συσκευής μένει: δεν ξεκλειδώνει τίποτα χωρίς αποθηκευμένο blob, και μια νέα εγγραφή το ξαναχρησιμοποιεί. */
export function clearQuick() { write(null) }

/** Καταχώριση PIN για αυτή τη συσκευή. */
export async function enrolPin(pin: string, email: string, tokens: QuickTokens): Promise<string | null> {
  if (!/^\d{4}$/.test(pin)) return 'Το PIN θέλει ακριβώς 4 ψηφία.'
  if (/^(\d)\1{3}$/.test(pin)) return 'Διάλεξε PIN που δεν είναι τέσσερα ίδια ψηφία.'
  if (!quickSupported()) return 'Η συσκευή δεν υποστηρίζει γρήγορη είσοδο.'
  try {
    const key = await deviceKey(true)
    if (!key) return 'Δεν ήταν δυνατή η δημιουργία κλειδιού στη συσκευή.'
    const salt = rand(16), iv = rand(12)
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(JSON.stringify(tokens)))
    write({ email, iv: b64(iv), ct: b64(ct), pin: { salt: b64(salt), hash: await pinHash(pin, salt, ITER), iter: ITER }, tries: 0, bio: read()?.bio })
    return null
  } catch (e) { return (e as Error).message }
}

/** Ξαναγράφει τα tokens όταν τα ανανεώνει το Supabase — χωρίς PIN, με το κλειδί συσκευής. */
export async function refreshQuick(tokens: QuickTokens) {
  const v = read(); if (!v) return
  try {
    const key = await deviceKey(false); if (!key) return
    const iv = rand(12)
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(JSON.stringify(tokens)))
    write({ ...v, iv: b64(iv), ct: b64(ct) })
  } catch { /* η γρήγορη είσοδος είναι ευκολία, ποτέ δεν μπλοκάρει τη ροή */ }
}

async function openVault(v: Vault): Promise<QuickTokens> {
  const key = await deviceKey(false)
  if (!key) { clearQuick(); throw new Error('Το κλειδί αυτής της συσκευής δεν βρέθηκε. Συνδέσου ξανά.') }
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) as BufferSource }, key, unb64(v.ct) as BufferSource)
  return JSON.parse(new TextDecoder().decode(plain)) as QuickTokens
}

/** Ξεκλείδωμα με PIN. Πέντε αποτυχίες σβήνουν τη γρήγορη είσοδο από τη συσκευή. */
export async function unlockWithPin(pin: string): Promise<{ tokens?: QuickTokens; error?: string }> {
  const v = read(); if (!v) return { error: 'Δεν υπάρχει γρήγορη είσοδος σε αυτή τη συσκευή.' }
  const hash = await pinHash(pin, unb64(v.pin.salt), v.pin.iter)
  if (hash !== v.pin.hash) {
    const tries = v.tries + 1
    if (tries >= MAX_TRIES) { clearQuick(); return { error: 'Πέντε λάθος προσπάθειες — η γρήγορη είσοδος διαγράφηκε. Συνδέσου με email.' } }
    write({ ...v, tries })
    return { error: 'Λάθος PIN. Απομένουν ' + (MAX_TRIES - tries) + ' προσπάθειες.' }
  }
  write({ ...v, tries: 0 })
  try { return { tokens: await openVault(v) } } catch (e) { return { error: (e as Error).message } }
}

// ---------- Face ID / δακτυλικό (WebAuthn, platform authenticator) ----------
export async function bioSupported(): Promise<boolean> {
  try {
    if (!globalThis.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

/** Δένει βιομετρικό διαπιστευτήριο της συσκευής ως εναλλακτική πύλη για το ίδιο κλειδί. */
export async function enableBio(email: string): Promise<string | null> {
  const v = read(); if (!v) return 'Όρισε πρώτα PIN.'
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: 'GNC 3on3', id: location.hostname },
        user: { id: rand(16), name: email, displayName: email },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60_000,
        attestation: 'none',
      },
    }) as PublicKeyCredential | null
    if (!cred) return 'Ακυρώθηκε.'
    write({ ...read()!, bio: { id: b64(cred.rawId) } })
    return null
  } catch (e) {
    const err = e as Error
    return err.name === 'NotAllowedError' ? 'Ακυρώθηκε ή έληξε ο χρόνος.' : err.message
  }
}

export function disableBio() { const v = read(); if (v) write({ ...v, bio: undefined }) }

export async function unlockWithBio(): Promise<{ tokens?: QuickTokens; error?: string }> {
  const v = read(); if (!v?.bio) return { error: 'Δεν έχει ενεργοποιηθεί βιομετρική είσοδος.' }
  try {
    const got = await navigator.credentials.get({
      publicKey: {
        challenge: rand(32),
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: unb64(v.bio.id) as BufferSource }],
        userVerification: 'required',
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null
    if (!got) return { error: 'Ακυρώθηκε.' }
    write({ ...v, tries: 0 })
    return { tokens: await openVault(v) }
  } catch (e) {
    const err = e as Error
    return { error: err.name === 'NotAllowedError' ? 'Ακυρώθηκε ή έληξε ο χρόνος.' : err.message }
  }
}
