import { execSync } from "child_process"
import { rmSync, symlinkSync, existsSync } from "fs"

const project = process.env.VERCEL_PROJECT_NAME

function run(cmd) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: "inherit", cwd: process.cwd() })
}

run("npx prisma generate")

if (project === "ordora-app") {
  console.log("Building ordora-app...")
  run("cd app && npm run build")
} else if (project === "ordora") {
  console.log("Building ordora (admin)...")
  run("cd admin && npm run build")
} else {
  console.log("Building storefront...")
  run("cd storefront && npm run build")
}

// Symlink the correct .next output to root for Vercel
const src = project === "ordora-app" ? "app/.next" : project === "ordora" ? "admin/.next" : "storefront/.next"
if (existsSync(src)) {
  try { rmSync(".next", { recursive: true, force: true }) } catch {}
  symlinkSync(src, ".next")
  console.log(`Symlinked ${src} -> .next`)
}
