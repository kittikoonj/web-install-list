import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstallList } from './install-list.entity';

@Entity('install_list_customers')
export class InstallListCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'list_id', type: 'int' })
  listId: number;

  @ManyToOne(() => InstallList, (list) => list.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: InstallList;

  @Column({ name: 'customer_name', type: 'varchar', length: 200 })
  customerName: string;

  @Column({ name: 'installer_name', type: 'varchar', length: 100, nullable: true })
  installerName: string | null;

  @Column({ name: 'installed_at', type: 'date' })
  installedAt: string;

  @Column({ name: 'test_case_url', type: 'varchar', length: 500, nullable: true })
  testCaseUrl: string | null;
}
