import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before rotating');
  }

  const result = await prisma.user.updateMany({
    where: { email },
    data: { password: await bcrypt.hash(password, 12) },
  });
  if (result.count !== 1) throw new Error(`Expected one account for ${email}; found ${result.count}`);
  console.log(`Password rotated for ${email}.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });