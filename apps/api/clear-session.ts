import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSession() {
  const email = 'seuemail@exemplo.com'; // <-- altere para o seu email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('Usuário não encontrado');
    return;
  }
  const result = await prisma.userSession.deleteMany({ where: { userId: user.id } });
  console.log(`Sessões removidas: ${result.count}`);
}

clearSession()
  .catch(console.error)
  .finally(() => prisma.$disconnect());