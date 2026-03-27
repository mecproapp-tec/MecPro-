const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await bcrypt.hash('Vasco2026@', 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Mecpro',
      documentType: 'LTDA',
      documentNumber: '72790660000',
      cep: '00000000',
      address: 'rua professor eurico Rabelo 11 maracaña',
      email: 'mecpro@tec.br',
      phone: '21999999999',
      status: 'ACTIVE',
      paymentStatus: 'pending',
    },
  });
  console.log('Tenant criado:', tenant);
  const user = await prisma.user.create({
    data: {
      name: 'Mecpro',
      email: 'mecpro@tec.br',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: tenant.id,
    },
  });
  console.log('Usuário criado:', user);
  console.log('\n✅ Dados inseridos com sucesso!');
}
main()
  .catch((e) => {
    console.error('❌ Erro ao inserir dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
