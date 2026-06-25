import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';

export type AttachmentFileType = 'image' | 'file';

@Entity('issue_attachments')
export class IssueAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  issueId: number;

  @ManyToOne(() => Issue, (issue) => issue.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'stored_name', type: 'varchar', length: 255 })
  storedName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: ['image', 'file'],
  })
  fileType: AttachmentFileType;

  @Column({ name: 'file_size', type: 'int', default: 0 })
  fileSize: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
