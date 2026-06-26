import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { InstallList } from './install-list.entity';
import { IssueAttachment } from './issue-attachment.entity';
import { IssueComment } from './issue-comment.entity';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'install_list_id', type: 'int' })
  installListId: number;

  @ManyToOne(() => InstallList, (list) => list.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'install_list_id' })
  installList: InstallList;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: IssueStatus;

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

  @OneToMany(() => IssueAttachment, (attachment) => attachment.issue)
  attachments: IssueAttachment[];

  @OneToMany(() => IssueComment, (comment) => comment.issue)
  comments: IssueComment[];
}
