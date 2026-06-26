import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingOs } from '../entities/setting-os.entity';
import { SettingProgramName } from '../entities/setting-program-name.entity';
import { SettingCustomerName } from '../entities/setting-customer-name.entity';
import { Program } from '../entities/program.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsLookupController } from './settings-lookup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SettingOs,
      SettingProgramName,
      SettingCustomerName,
      Program,
    ]),
  ],
  providers: [SettingsService],
  controllers: [SettingsController, SettingsLookupController],
  exports: [SettingsService],
})
export class SettingsModule {}
