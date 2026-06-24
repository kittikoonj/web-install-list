import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type InstallMethod = 'offline' | 'docker' | 'online';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string | null;

  @Column({ name: 'github_url', type: 'varchar', length: 500 })
  githubUrl: string;

  @Column({ type: 'json' })
  methods: InstallMethod[];

  @Column({ type: 'varchar', length: 100 })
  icon: string;

  @Column({ name: 'icon_bg', type: 'varchar', length: 20 })
  iconBg: string;

  @Column({ name: 'icon_fg', type: 'varchar', length: 20 })
  iconFg: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

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
}
