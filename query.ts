import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.notification.count();
  console.log("Total notifications:", count);
  const notifications = await prisma.notification.findMany({ take: 2 });
  console.log(JSON.stringify(notifications, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
