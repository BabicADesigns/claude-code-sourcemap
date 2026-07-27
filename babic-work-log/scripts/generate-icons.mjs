import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const CREAM = [0xf5, 0xee, 0xe6]
const SAGE = [0x8b, 0x9b, 0x7a]
const GOLD = [0xd9, 0xae, 0x55]
const INK = [0x3a, 0x35, 0x2e]

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

function drawMark(size, { maskable }) {
  const png = new PNG({ width: size, height: size })
  const scale = maskable ? 0.72 : 1 // shrink composition into the safe zone for maskable
  const cx = size / 2
  const cy = size * (maskable ? 0.5 : 0.46)

  const clockR = size * 0.22 * scale
  const ringW = Math.max(2, size * 0.032 * scale)
  const handW = Math.max(1, size * 0.013 * scale)
  const shadowR = clockR * 1.15

  // bottom sage band: a gentle dome-shaped horizon, smaller than a full-bleed fill
  const bandBaseY = size * (0.86 - (1 - scale) * 0.3)
  const bandAmplitude = size * 0.045 * scale

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2

      let color = CREAM

      // soft shadow beneath the clock ring
      const dxs = x - cx
      const dys = y - (cy + clockR * 0.55)
      const shadowDist = Math.sqrt(dxs * dxs + dys * dys * 1.6)
      if (shadowDist < shadowR) {
        const t = 1 - shadowDist / shadowR
        color = mix(color, [0, 0, 0], t * 0.06)
      }

      // bottom band with a gentle curved top edge
      const t = Math.max(-1, Math.min(1, (x - cx) / (size / 2)))
      const curve = Math.cos((t * Math.PI) / 2)
      const bandTop = bandBaseY - bandAmplitude * curve
      if (y >= bandTop) {
        const edgeSoftness = Math.min(1, Math.max(0, (y - bandTop) / 1.5))
        color = mix(color, SAGE, edgeSoftness)
      }

      // clock ring + hands (drawn after the band so it always reads clearly)
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= clockR && dist >= clockR - ringW) {
        color = GOLD
      }

      png.data[idx] = color[0]
      png.data[idx + 1] = color[1]
      png.data[idx + 2] = color[2]
      png.data[idx + 3] = 255
    }
  }

  // slender minute/hour hands at an elegant ~10:10 position, plus a small center dot
  const drawLine = (x0, y0, x1, y1, width, color) => {
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x0 + (x1 - x0) * t
      const py = y0 + (y1 - y0) * t
      for (let ox = -width; ox <= width; ox++) {
        for (let oy = -width; oy <= width; oy++) {
          if (ox * ox + oy * oy > width * width + 1) continue
          const xi = Math.round(px + ox)
          const yi = Math.round(py + oy)
          if (xi < 0 || yi < 0 || xi >= size || yi >= size) continue
          const idx = (size * yi + xi) << 2
          png.data[idx] = color[0]
          png.data[idx + 1] = color[1]
          png.data[idx + 2] = color[2]
          png.data[idx + 3] = 255
        }
      }
    }
  }

  drawLine(cx, cy, cx, cy - clockR * 0.5, handW, INK)
  drawLine(cx, cy, cx + clockR * 0.36, cy - clockR * 0.2, handW, INK)
  drawLine(cx - 1, cy - 1, cx + 1, cy + 1, handW + 1, INK)

  return png
}

function save(png, name) {
  const buf = PNG.sync.write(png)
  writeFileSync(join(outDir, name), buf)
  console.log('wrote', name)
}

save(drawMark(192, { maskable: false }), 'icon-192.png')
save(drawMark(512, { maskable: false }), 'icon-512.png')
save(drawMark(512, { maskable: true }), 'icon-maskable-512.png')
