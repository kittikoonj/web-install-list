import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstallList } from './install-list.entity';
import { Program } from './program.entity';
import type { InstallMethod } from './program.entity';

@Entity('install_list_items')
export class InstallListItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'list_id', type: 'int' })
  listId: number;

  @ManyToOne(() => InstallList, (list) => list.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: InstallList;

  @Column({ name: 'program_id', type: 'int' })
  programId: number;

  @ManyToOne(() => Program, { eager: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ type: 'enum', enum: ['offline', 'docker', 'online'] })
  method: InstallMethod;

  @Column({ name: 'is_installed', type: 'tinyint', default: 0 })
  isInstalled: number;
}
