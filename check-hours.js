const {PrismaClient} = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const hours = await p.storeOpeningHour.findMany({where:{store:{slug:'chesters-wigan-road'}},orderBy:{day:'asc'}})
  console.log(JSON.stringify(hours, null, 2))
  const store = await p.store.findUnique({where:{slug:'chesters-wigan-road'}, select:{deliveryEnabled:true, collectionEnabled:true, lastOrderTimeCollection:true, lastOrderTimeDelivery:true}})
  console.log('Store:', JSON.stringify(store, null, 2))
  await p.$disconnect()
}
main()
