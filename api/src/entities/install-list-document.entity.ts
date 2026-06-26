import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstallList } from './install-list.entity';

@Entity('install_list_documents')
export class InstallListDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'list_id', type: 'int' })
  listId: number;

  @ManyToOne(() => InstallList, (list) => list.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: InstallList;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'stored_name', type: 'varchar', length: 255 })
  storedName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'int', default: 0 })
  fileSize: number;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 100, nullable: true })
  uploadedBy: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
