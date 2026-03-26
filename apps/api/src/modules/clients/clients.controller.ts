import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() data: any, @Req() req) {
    return this.clientsService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req) {
    return this.clientsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.clientsService.findOne(Number(id), req.user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.clientsService.update(Number(id), req.user.tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.clientsService.remove(Number(id), req.user.tenantId);
  }
}