import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

// 👇 IMPORTA O STORAGE
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}