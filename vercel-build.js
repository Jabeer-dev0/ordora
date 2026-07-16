const { execSync } = require("child_process")

const dir = process.argv[2] // "app" or "admin"

if (!dir || !["app", "admin"].includes(dir)) {
  console.error("Usage: node vercel-build.js <app|admin>")
  process.exit(1)
}

console.log(`Building ${dir}...`)

// Install from root (monorepo)
execSync("npm install", { cwd: __dirname, stdio: "inherit" })

// Generate Prisma client
execSync("npx prisma generate", { cwd: `${__dirname}/prisma`, stdio: "inherit" })

// Build the specific app
execSync("npm run build", { cwd: `${__dirname}/${dir}`, stdio: "inherit" })
