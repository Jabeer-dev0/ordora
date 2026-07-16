import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clean
  await prisma.orderItemModifier.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItemModifierGroup.deleteMany()
  await prisma.modifier.deleteMany()
  await prisma.modifierGroup.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.user.deleteMany()
  await prisma.store.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.tenant.deleteMany()

  const hash = await bcrypt.hash("password", 10)
  const adminHash = await bcrypt.hash("admin123", 10)

  const superAdmin = await prisma.user.create({
    data: { email: "admin@ordora.com", name: "Super Admin", password: adminHash, role: "SUPER_ADMIN" },
  })

  const tenant = await prisma.tenant.create({
    data: { name: "Demo Restaurant", slug: "demo-restaurant", plan: "PRO", status: "ACTIVE" },
  })

  const store = await prisma.store.create({
    data: { tenantId: tenant.id, name: "Main Store", address: "123 High Street, Blackburn", phone: "0123456789" },
  })

  const owner = await prisma.user.create({
    data: { tenantId: tenant.id, email: "demo@ordora.com", name: "Demo Owner", password: hash, role: "OWNER" },
  })

  // Create modifier groups
  const sizeGroup = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Size", required: true, minSelect: 1, maxSelect: 1, sortOrder: 0 },
  })
  const sizeSmall = await prisma.modifier.create({ data: { modifierGroupId: sizeGroup.id, name: "Small", price: 0, sortOrder: 0 } })
  const sizeMedium = await prisma.modifier.create({ data: { modifierGroupId: sizeGroup.id, name: "Medium", price: 2, sortOrder: 1 } })
  const sizeLarge = await prisma.modifier.create({ data: { modifierGroupId: sizeGroup.id, name: "Large", price: 4, sortOrder: 2 } })

  const toppingsGroup = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Extra Toppings", required: false, minSelect: 0, maxSelect: 5, sortOrder: 1 },
  })
  const topCheese = await prisma.modifier.create({ data: { modifierGroupId: toppingsGroup.id, name: "Extra Cheese", price: 1.5, sortOrder: 0 } })
  const topMushroom = await prisma.modifier.create({ data: { modifierGroupId: toppingsGroup.id, name: "Mushrooms", price: 1, sortOrder: 1 } })
  const topPepper = await prisma.modifier.create({ data: { modifierGroupId: toppingsGroup.id, name: "Peppers", price: 1, sortOrder: 2 } })
  const topOnion = await prisma.modifier.create({ data: { modifierGroupId: toppingsGroup.id, name: "Onions", price: 0.5, sortOrder: 3 } })
  const topJalapeno = await prisma.modifier.create({ data: { modifierGroupId: toppingsGroup.id, name: "Jalapeños", price: 1, sortOrder: 4 } })

  const sidesGroup = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Choose a Side", required: false, minSelect: 0, maxSelect: 2, sortOrder: 2 },
  })
  const sideChips = await prisma.modifier.create({ data: { modifierGroupId: sidesGroup.id, name: "Chips", price: 0, sortOrder: 0 } })
  const sideSalad = await prisma.modifier.create({ data: { modifierGroupId: sidesGroup.id, name: "Side Salad", price: 0, sortOrder: 1 } })
  const sideRice = await prisma.modifier.create({ data: { modifierGroupId: sidesGroup.id, name: "Rice", price: 0, sortOrder: 2 } })
  const sideColeslaw = await prisma.modifier.create({ data: { modifierGroupId: sidesGroup.id, name: "Coleslaw", price: 0.5, sortOrder: 3 } })

  const sauceGroup = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Sauce", required: false, minSelect: 0, maxSelect: 3, sortOrder: 3 },
  })
  const sauceKetchup = await prisma.modifier.create({ data: { modifierGroupId: sauceGroup.id, name: "Ketchup", price: 0, sortOrder: 0 } })
  const sauceMayo = await prisma.modifier.create({ data: { modifierGroupId: sauceGroup.id, name: "Mayo", price: 0, sortOrder: 1 } })
  const sauceBBQ = await prisma.modifier.create({ data: { modifierGroupId: sauceGroup.id, name: "BBQ Sauce", price: 0, sortOrder: 2 } })
  const sauceHot = await prisma.modifier.create({ data: { modifierGroupId: sauceGroup.id, name: "Hot Sauce", price: 0, sortOrder: 3 } })

  const drinkSize = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Drink Size", required: true, minSelect: 1, maxSelect: 1, sortOrder: 0 },
  })
  const dsSmall = await prisma.modifier.create({ data: { modifierGroupId: drinkSize.id, name: "Regular (330ml)", price: 0, sortOrder: 0 } })
  const dsLarge = await prisma.modifier.create({ data: { modifierGroupId: drinkSize.id, name: "Large (500ml)", price: 1, sortOrder: 1 } })

  const spiceLevel = await prisma.modifierGroup.create({
    data: { storeId: store.id, name: "Spice Level", required: true, minSelect: 1, maxSelect: 1, sortOrder: 0 },
  })
  const slMild = await prisma.modifier.create({ data: { modifierGroupId: spiceLevel.id, name: "Mild", price: 0, sortOrder: 0 } })
  const slMedium = await prisma.modifier.create({ data: { modifierGroupId: spiceLevel.id, name: "Medium", price: 0, sortOrder: 1 } })
  const slHot = await prisma.modifier.create({ data: { modifierGroupId: spiceLevel.id, name: "Hot", price: 0, sortOrder: 2 } })

  // Create menu items
  const pizzaCategory = "Pizza"
  const burgerCategory = "Burgers"
  const sideCategory = "Sides"
  const drinkCategory = "Drinks"
  const dessertCategory = "Desserts"

  const margherita = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Margherita", description: "Classic tomato, mozzarella, basil", price: 9.99, category: pizzaCategory, sortOrder: 0 },
  })
  const pepperoni = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Pepperoni", description: "Pepperoni, mozzarella, tomato sauce", price: 11.99, category: pizzaCategory, sortOrder: 1 },
  })
  const hawaiian = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Hawaiian", description: "Ham, pineapple, mozzarella", price: 11.49, category: pizzaCategory, sortOrder: 2 },
  })
  const veggie = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Veggie Supreme", description: "Peppers, onions, mushrooms, olives", price: 10.99, category: pizzaCategory, sortOrder: 3 },
  })

  const classic = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Classic Burger", description: "Beef patty, lettuce, tomato, cheese", price: 8.99, category: burgerCategory, sortOrder: 0 },
  })
  const bacon = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Bacon Burger", description: "Beef patty, crispy bacon, cheddar", price: 9.99, category: burgerCategory, sortOrder: 1 },
  })
  const chicken = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Chicken Burger", description: "Grilled chicken, mayo, lettuce", price: 8.49, category: burgerCategory, sortOrder: 2 },
  })
  const double = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Double Stack", description: "Two beef patties, double cheese", price: 12.99, category: burgerCategory, sortOrder: 3 },
  })

  const chips = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Chips", description: "Golden crispy fries", price: 3.49, category: sideCategory, sortOrder: 0 },
  })
  const onionRings = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Onion Rings", description: "Battered onion rings", price: 3.99, category: sideCategory, sortOrder: 1 },
  })
  const wings = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Chicken Wings (6)", description: "Spicy buffalo wings", price: 5.99, category: sideCategory, sortOrder: 2 },
  })

  const coke = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Coca Cola", description: "Classic cola", price: 1.99, category: drinkCategory, sortOrder: 0 },
  })
  const fanta = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Fanta Orange", description: "Orange fizzy drink", price: 1.99, category: drinkCategory, sortOrder: 1 },
  })
  const water = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Water", description: "Still water", price: 0.99, category: drinkCategory, sortOrder: 2 },
  })

  const cake = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Chocolate Cake", description: "Rich chocolate fudge cake", price: 4.99, category: dessertCategory, sortOrder: 0 },
  })
  const iceCream = await prisma.menuItem.create({
    data: { storeId: store.id, name: "Ice Cream", description: "Vanilla, chocolate or strawberry", price: 2.99, category: dessertCategory, sortOrder: 1 },
  })

  // Assign modifier groups to menu items
  const allMenuItems = [margherita, pepperoni, hawaiian, veggie, classic, bacon, chicken, double, chips, onionRings, wings, coke, fanta, water, cake, iceCream]
  
  // Pizzas get: size + toppings
  for (const item of [margherita, pepperoni, hawaiian, veggie]) {
    await prisma.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: sizeGroup.id, sortOrder: 0 } })
    await prisma.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: toppingsGroup.id, sortOrder: 1 } })
  }
  // Burgers get: sides + sauce
  for (const item of [classic, bacon, chicken, double]) {
    await prisma.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: sidesGroup.id, sortOrder: 0 } })
    await prisma.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: sauceGroup.id, sortOrder: 1 } })
  }
  // Sides: wings get spice level
  await prisma.menuItemModifierGroup.create({ data: { menuItemId: wings.id, modifierGroupId: spiceLevel.id, sortOrder: 0 } })
  // Drinks get drink size
  for (const item of [coke, fanta, water]) {
    await prisma.menuItemModifierGroup.create({ data: { menuItemId: item.id, modifierGroupId: drinkSize.id, sortOrder: 0 } })
  }

  // Create staff
  await prisma.staff.create({ data: { storeId: store.id, name: "Ahmed Khan", role: "MANAGER", email: "ahmed@demo.com", phone: "07123456789" } })
  await prisma.staff.create({ data: { storeId: store.id, name: "Sarah Ali", role: "CHEF", email: "sarah@demo.com", phone: "07234567890" } })
  await prisma.staff.create({ data: { storeId: store.id, name: "James Wilson", role: "WAITER", email: "james@demo.com", phone: "07345678901" } })
  await prisma.staff.create({ data: { storeId: store.id, name: "Fatima Noor", role: "CASHIER", email: "fatima@demo.com", phone: "07456789012" } })

  // Create demo orders
  const user = await prisma.user.findFirst({ where: { email: "demo@ordora.com" } })
  for (let i = 0; i < 5; i++) {
    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        userId: user?.id,
        status: ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"][i],
        source: ["TILL", "WEB", "PHONE"][i % 3],
        orderType: "DINE_IN",
        subtotal: 25.97,
        tax: 2.08,
        total: 28.05,
        items: {
          create: [
            { menuItemId: margherita.id, quantity: 1, unitPrice: 9.99, total: 9.99 },
            { menuItemId: classic.id, quantity: 1, unitPrice: 8.99, total: 8.99 },
            { menuItemId: coke.id, quantity: 2, unitPrice: 1.99, total: 3.98 },
          ],
        },
      },
    })
  }

  await prisma.subscription.create({
    data: { tenantId: tenant.id, plan: "PRO", status: "active" },
  })

  console.log("Seed complete!")
  console.log("  Business Hub: demo@ordora.com / password")
  console.log("  Admin Panel:  admin@ordora.com / admin123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
