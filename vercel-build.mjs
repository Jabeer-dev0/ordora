import { execSync } from "child_process"
import { rmSync, symlinkSync, existsSync } from "fs"

const projectId = process.env.VERCEL_PROJECT_ID
const projectName = process.env.VERCEL_PROJECT_NAME

console.log(`VERCEL_PROJECT_ID: ${projectId}`)
console.log(`VERCEL_PROJECT_NAME: ${projectName}`)

function run(cmd) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: "inherit", cwd: process.cwd() })
}

run("npx prisma generate")

let target = "storefront"

if (projectId === "prj_UYvjTDphSCIKwSJaw6H3dDDJiEXo") {
  target = "app"
} else if (projectId === "prj_elVl4LzVBnMX0U29RlXF9XMncPpr") {
  target = "admin"
} else if (projectId === "prj_fQVmd9LdDgAzxRQGaG9jWo1H6TQY") {
  target = "storefront"
} else if (projectName === "ordora-app") {
  target = "app"
} else if (projectName === "ordora") {
  target = "admin"
}

console.log(`Building target: ${target}`)
run(`cd ${target} && npm run build`)

if (existsSync(`${target}/.next`)) {
  try { rmSync(".next", { recursive: true, force: true }) } catch {}
  symlinkSync(`${target}/.next`, ".next")
  console.log(`Symlinked ${target}/.next -> .next`)
}
