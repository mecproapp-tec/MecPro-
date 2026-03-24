import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../shared/prisma/prisma.service"

@Injectable()
export class DashboardService {

  constructor(private prisma: PrismaService) {}

  async getStats() {

    const clients = await this.prisma.client.count()

    const estimates = await this.prisma.estimate.count()

    const invoices = await this.prisma.invoice.count()

    return {
      clients,
      estimates,
      invoices
    }

  }

}
