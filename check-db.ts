import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const t = await p.tenant.findMany()
  console.log("Tenants:", JSON.stringify(t, null, 2))
  const s = await p.store.findMany()
  console.log("Stores:", JSON.stringify(s, null, 2))
  const u = await p.user.findMany({ select: { id: true, email: true, role: true, tenantId: true } })
  console.log("Users:", JSON.stringify(u, null, 2))
  await p.$disconnect()
}
main()
