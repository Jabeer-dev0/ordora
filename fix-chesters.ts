import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
const p = new PrismaClient()
async function main() {
  const chesters = await p.tenant.findUnique({ where: { id: "cmrowo72w0000oynn17id2z3m" } })
  if (!chesters) { console.log("Chesters tenant not found"); return }

  const existingStore = await p.store.findFirst({ where: { tenantId: chesters.id } })
  if (!existingStore) {
    const store = await p.store.create({
      data: { tenantId: chesters.id, name: "Chesters", slug: "chesters" }
    })
    console.log("Created store:", store.id)
  } else {
    console.log("Store already exists:", existingStore.id)
  }

  const existingUser = await p.user.findFirst({ where: { tenantId: chesters.id } })
  if (!existingUser) {
    const hash = await bcrypt.hash("password123", 12)
    const user = await p.user.create({
      data: { email: "chesters@ordora.com", name: "Chesters Owner", password: hash, role: "OWNER", tenantId: chesters.id }
    })
    console.log("Created user:", user.email)
    console.log("Login: chesters@ordora.com / password123")
  } else {
    console.log("User already exists:", existingUser.email)
  }

  await p.$disconnect()
}
main()
