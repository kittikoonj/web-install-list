import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { InstallListCustomer } from './install-list-customer.entity';
import { InstallListItem } from './install-list-item.entity';

@Entity('install_list_customer_items')
@Unique(['customerId', 'itemId'])
export class InstallListCustomerItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', type: 'int' })
  customerId: number;

  @ManyToOne(() => InstallListCustomer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: InstallListCustomer;

  @Column({ name: 'item_id', type: 'int' })
  itemId: number;

  @ManyToOne(() => InstallListItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: InstallListItem;

  @Column({ name: 'is_installed', type: 'tinyint', default: 0 })
  isInstalled: number;
}
