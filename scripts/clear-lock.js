import { existsSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"

const candidates = [
  join(process.cwd(), ".next", "dev", "lock"),
  resolve(process.cwd(), "..", ".next", "dev", "lock"),
]

let removed = false
for (const lockPath of candidates) {
  if (!existsSync(lockPath)) continue
  unlinkSync(lockPath)
  console.log(`Removed lock file: ${lockPath}`)
  removed = true
}

if (!removed) {
  console.log("No Next.js dev lock file found.")
}
