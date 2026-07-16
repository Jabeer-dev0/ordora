const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function seed() {
  const store = await prisma.store.findFirst()
  if (!store) { console.log("No store found"); return }

  await prisma.store.update({
    where: { id: store.id },
    data: {
      slug: "demo-restaurant",
      phone: "0123456789",
      address: "123 High Street, Blackburn",
      postcode: "BB1 1AA",
      webServiceCharge: 100,
      bagCharge: 20,
    },
  })
  console.log("Store updated:", store.name)

  await prisma.storeOpeningHour.deleteMany({ where: { storeId: store.id } })
  for (let day = 0; day < 7; day++) {
    await prisma.storeOpeningHour.create({ data: { storeId: store.id, orderType: "STORE", day, open: "09:00", close: "23:00" } })
    await prisma.storeOpeningHour.create({ data: { storeId: store.id, orderType: "DELIVERY", day, open: "11:00", close: "22:30" } })
    await prisma.storeOpeningHour.create({ data: { storeId: store.id, orderType: "COLLECTION", day, open: "10:00", close: "22:00" } })
  }
  console.log("Opening hours created (21 entries)")

  await prisma.banner.deleteMany({ where: { storeId: store.id } })
  await prisma.banner.create({ data: { storeId: store.id, title: "Welcome to Demo Restaurant", subtitle: "Order online for collection or delivery", ctaLabel: "Order Now", ctaUrl: "/menu", isActive: true, sortOrder: 0 } })
  await prisma.banner.create({ data: { storeId: store.id, title: "20% Off First Order", subtitle: "Use code WELCOME20 at checkout", ctaLabel: "Order Now", ctaUrl: "/menu", isActive: true, sortOrder: 1 } })
  console.log("Banners created")

  const items = await prisma.menuItem.findMany({ where: { storeId: store.id } })
  for (let i = 0; i < Math.min(6, items.length); i++) {
    await prisma.menuItem.update({ where: { id: items[i].id }, data: { isFeatured: true } })
  }
  console.log("Featured items set:", Math.min(6, items.length))

  await prisma.$disconnect()
  console.log("Done!")
}
seed().catch(e => { console.error(e); process.exit(1) })
