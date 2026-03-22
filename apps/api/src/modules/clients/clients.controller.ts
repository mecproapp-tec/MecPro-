import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { ClientsService } from './clients.service';
import { Client } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(
    @Body() data: { name: string; phone: string; vehicle: string; plate: string },
    @Req() req,
  ): Promise<Client> {
    if (!req.user) throw new UnauthorizedException();

    return this.clientsService.create(req.user.tenantId, data);
  }

  @Get()
  async findAll(@Req() req): Promise<Client[]> {
    if (!req.user) throw new UnauthorizedException();

    return this.clientsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req): Promise<Client> {
    if (!req.user) throw new UnauthorizedException();

    return this.clientsService.findOne(Number(id), req.user.tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Client>,
    @Req() req,
  ): Promise<Client> {
    if (!req.user) throw new UnauthorizedException();

    return this.clientsService.update(Number(id), req.user.tenantId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    if (!req.user) throw new UnauthorizedException();

    return this.clientsService.remove(Number(id), req.user.tenantId);
  }
}