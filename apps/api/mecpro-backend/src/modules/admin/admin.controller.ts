import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { TenantStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('tenants')
  async getTenants(@Query() query: { search?: string; status?: string }) {
    return this.adminService.getTenants(query);
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenant(id);
  }

  @Put('tenants/:id/status')
  async updateTenantStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const status = body.status as TenantStatus;
    return this.adminService.updateTenantStatus(id, status);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Param('id') id: string) {
    return this.adminService.deleteTenant(id);
  }

  @Get('financial/summary')
  async getFinancialSummary(@Query() query: { month?: string; year?: string }) {
    return this.adminService.getFinancialSummary(query);
  }

  @Post('notifications/send')
  async sendNotification(@Body() body: { message: string; title: string; target: 'all' | 'specific'; tenantIds?: string[] }) {
    return this.adminService.sendNotification(body);
  }

  @Post('notifications/schedule')
  async scheduleNotification(@Body() body: { message: string; title: string; schedule: Date; target: 'all' | 'specific'; tenantIds?: string[] }) {
    return this.adminService.scheduleNotification(body);
  }

  // ✅ Nova rota para listar todas as faturas
  @Get('invoices')
  async getAllInvoices(@Query() query: { tenantId?: string; status?: string; startDate?: string; endDate?: string }) {
    return this.adminService.getAllInvoices(query);
  }
}