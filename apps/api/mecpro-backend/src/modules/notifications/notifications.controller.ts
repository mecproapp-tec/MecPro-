import { Controller, Get, Put, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req) {
    return this.notificationsService.findAll(req.user.tenantId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markAsRead(Number(id), req.user.tenantId);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.tenantId);
  }
}