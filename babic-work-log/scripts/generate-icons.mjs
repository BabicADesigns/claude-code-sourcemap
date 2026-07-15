import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const SAGE = [0x8b, 0x9b, 0x7a]
const CREAM = [0xf5, 0xee, 0xe6]
const GOLD = [0xf0, 0xc8, 0x78]

function drawMark(size, { maskable }) {
  const png = new PNG({ width: size, height: size })
  const cx = size / 2
  const cy = size / 2
  // maskable icons need a safe zone (~40% padding) so the mark isn't clipped
  const outerR = maskable ? size * 0.42 : size * 0.48
  const clockR = size * 0.3
  const ringW = size * 0.045

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let color = null

      if (maskable) {
        color = SAGE
      } else if (dist <= outerR) {
        color = SAGE
      }

      if (color) {
        // rounded-rect background for non-maskable via corner cutoff
        if (!maskable) {
          const corner = size * 0.22
          const inCorner =
            (x < corner && y < corner && Math.hypot(corner - x, corner - y) > corner) ||
            (x > size - corner && y < corner && Math.hypot(x - (size - corner), corner - y) > corner) ||
            (x < corner && y > size - corner && Math.hypot(corner - x, y - (size - corner)) > corner) ||
            (x > size - corner && y > size - corner && Math.hypot(x - (size - corner), y - (size - corner)) > corner)
          if (inCorner) color = null
        }
      }

      if (color) {
        // clock face ring in warm gold, cream center — simple work-log mark
        if (dist <= clockR && dist >= clockR - ringW) {
          color = GOLD
        } else if (dist < clockR - ringW) {
          color = CREAM
        }
      }

      if (color) {
        png.data[idx] = color[0]
        png.data[idx + 1] = color[1]
        png.data[idx + 2] = color[2]
        png.data[idx + 3] = 255
      } else {
        png.data[idx] = 0
        png.data[idx + 1] = 0
        png.data[idx + 2] = 0
        png.data[idx + 3] = 0
      }
    }
  }

  // clock hands (simple cross pointing to ~10:10)
  const handColor = SAGE
  const drawLine = (x0, y0, x1, y1, width) => {
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x0 + (x1 - x0) * t
      const py = y0 + (y1 - y0) * t
      for (let ox = -width; ox <= width; ox++) {
        for (let oy = -width; oy <= width; oy++) {
          const xi = Math.round(px + ox)
          const yi = Math.round(py + oy)
          if (xi < 0 || yi < 0 || xi >= size || yi >= size) continue
          const idx = (size * yi + xi) << 2
          png.data[idx] = handColor[0]
          png.data[idx + 1] = handColor[1]
          png.data[idx + 2] = handColor[2]
          png.data[idx + 3] = 255
        }
      }
    }
  }
  const hw = Math.max(1, Math.round(size * 0.018))
  drawLine(cx, cy, cx, cy - clockR * 0.55, hw)
  drawLine(cx, cy, cx + clockR * 0.4, cy - clockR * 0.15, hw)

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
