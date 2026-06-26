import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InstallListItem } from './install-list-item.entity';
import { InstallListCustomer } from './install-list-customer.entity';
import { InstallListDocument } from './install-list-document.entity';
import { Issue } from './issue.entity';

@Entity('install_lists')
export class InstallList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'is_delete', type: 'tinyint', default: 0 })
  isDelete: number;

  @Column({ name: 'deleted_by', type: 'varchar', length: 100, nullable: true })
  deletedBy: string | null;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => InstallListItem, (item) => item.list, { cascade: true })
  items: InstallListItem[];

  @OneToMany(() => InstallListCustomer, (customer) => customer.list, {
    cascade: true,
  })
  customers: InstallListCustomer[];

  @OneToMany(() => InstallListDocument, (doc) => doc.list)
  documents: InstallListDocument[];

  @OneToMany(() => Issue, (issue) => issue.installList)
  issues: Issue[];
}
