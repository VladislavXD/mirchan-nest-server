import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Пользователь с email "${email}" не найден.`);
    process.exit(1);
  }

  const hashedPassword = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`✓ Пароль для пользователя "${email}" успешно обновлён.`);
  console.log(`  Новый хеш: ${hashedPassword}`);
}

const [email, newPassword] = ['towersecrettop@gmail.com', '123456']

if (!email || !newPassword) {
  console.error(
    'Использование: npx ts-node scripts/changePass.ts <email> <новый_пароль>',
  );
  process.exit(1);
}

resetPassword(email, newPassword)
  .catch((err) => {
    console.error('Ошибка:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
