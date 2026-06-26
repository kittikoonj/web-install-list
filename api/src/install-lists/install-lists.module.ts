import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallList } from '../entities/install-list.entity';
import { InstallListItem } from '../entities/install-list-item.entity';
import { InstallListCustomer } from '../entities/install-list-customer.entity';
import { InstallListCustomerItem } from '../entities/install-list-customer-item.entity';
import { InstallListDocument } from '../entities/install-list-document.entity';
import { Program } from '../entities/program.entity';
import { InstallListsService } from './install-lists.service';
import { InstallListsController } from './install-lists.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InstallList,
      InstallListItem,
      InstallListCustomer,
      InstallListCustomerItem,
      InstallListDocument,
      Program,
    ]),
  ],
  providers: [InstallListsService],
  controllers: [InstallListsController],
})
export class InstallListsModule {}
