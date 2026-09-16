/** Tiny className joiner — avoids pulling clsx for a handful of call sites. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')
