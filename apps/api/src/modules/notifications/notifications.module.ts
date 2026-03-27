import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationCronService } from './notification-cron.service';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationCronService
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
