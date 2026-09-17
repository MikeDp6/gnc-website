/**
 * After the build, writes a 640px-wide copy of every picture in dist/img, next to the original as
 * name@640.ext. The site offers both to the browser, so a card 360px wide downloads a 640px file
 * instead of the full-size one.
 *
 * Every /img/ path gets a copy — even the already-small ones, which are simply copied — so the
 * @640 name is always there and the browser never asks for a file that does not exist.
 */
import { readdir, stat, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'dist', 'img')
const W = 640
const OK = new Set(['.jpg', '.jpeg', '.png'])

if (!existsSync(dir)) { console.log('make-image-sizes: no dist/img, skipping'); process.exit(0) }

async function walk(d) {
  const out = []
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) out.push(...await walk(p))
    else if (OK.has(extname(e.name).toLowerCase()) && !e.name.includes('@640')) out.push(p)
  }
  return out
}

const files = await walk(dir)
let made = 0, copied = 0, bytes = 0
await Promise.all(files.map(async f => {
  const ext = extname(f)
  const out = f.slice(0, -ext.length) + '@640' + ext
  try {
    const img = sharp(f)
    const meta = await img.metadata()
    if ((meta.width ?? 0) <= W) { await copyFile(f, out); copied++; return }
    const pipe = ext.toLowerCase() === '.png'
      ? img.resize({ width: W }).png({ compressionLevel: 9, palette: true })
      : img.resize({ width: W }).jpeg({ quality: 74, progressive: true, mozjpeg: true })
    await pipe.toFile(out)
    made++
    bytes += (await stat(f)).size - (await stat(out)).size
  } catch (e) {
    await copyFile(f, out).catch(() => {})
    copied++
  }
}))
console.log(`make-image-sizes: ${made} resized, ${copied} copied as-is, ${Math.round(bytes / 1024)}KB lighter per full set`)
