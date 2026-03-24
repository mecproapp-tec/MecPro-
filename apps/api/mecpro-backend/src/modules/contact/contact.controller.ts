import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Public } from '../../auth/public.decorator'; // ✅ importe o decorador público

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public() // ✅ torna a rota pública (não exige autenticação)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { userEmail?: string; userName?: string; message: string }, @Req() req) {
    const tenantId = req.user?.tenantId; // será undefined se não estiver logado
    return this.contactService.create({
      userEmail: body.userEmail,
      userName: body.userName,
      message: body.message,
      tenantId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.contactService.findOne(Number(id));
  }

  @Put(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async reply(@Param('id') id: string, @Body() body: { reply: string }) {
    return this.contactService.reply(Number(id), body.reply);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.contactService.remove(Number(id));
  }
}