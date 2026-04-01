import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Crear cliente Prisma con el adaptador
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("Uso: npx tsx scripts/reset-password.ts <email> <nueva-contraseña>");
    console.log("\nUsuarios disponibles:");
    
    const users = await prisma.user.findMany({
      select: { email: true, name: true }
    });
    
    users.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  console.log(`✅ Contraseña actualizada para: ${user.email}`);
}

resetPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
