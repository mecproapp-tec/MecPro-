import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() data: { clientId: number; date: string; comment?: string }, @Req() req) {
    return this.appointmentsService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req) {
    return this.appointmentsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.findOne(Number(id), req.user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { clientId: number; date: string; comment?: string }, @Req() req) {
    return this.appointmentsService.update(Number(id), req.user.tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.remove(Number(id), req.user.tenantId);
  }
}