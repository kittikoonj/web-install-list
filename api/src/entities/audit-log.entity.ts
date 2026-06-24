import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['create', 'update', 'delete'] })
  action: 'create' | 'update' | 'delete';

  @Column({ name: 'object_type', type: 'varchar', length: 50 })
  objectType: string;

  @Column({ name: 'object_id', type: 'int', nullable: true })
  objectId: number | null;

  @Column({ name: 'object_name', type: 'varchar', length: 200, nullable: true })
  objectName: string | null;

  @Column({ name: 'performed_by', type: 'varchar', length: 100, nullable: true })
  performedBy: string | null;

  @Column({
    name: 'performed_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  performedAt: Date;
}
