const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function fixAdmin() {
  const hash = await bcrypt.hash('Vasco2026@', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@mecprotec.br' },
    data: { password: hash, role: 'SUPER_ADMIN' },
  });
  console.log('Admin atualizado:', user);
}

fixAdmin()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());