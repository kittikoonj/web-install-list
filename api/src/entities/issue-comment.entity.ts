import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';

@Entity('issue_comments')
export class IssueComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  issueId: number;

  @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
