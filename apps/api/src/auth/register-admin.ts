async registerAdmin(data: { name: string; email: string; password: string }) {
  const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new BadRequestException('Email já cadastrado');

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await this.prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      // tenantId permanece null
    },
  });

  return { message: 'Administrador cadastrado com sucesso', user: { id: user.id, name: user.name, email: user.email } };
}