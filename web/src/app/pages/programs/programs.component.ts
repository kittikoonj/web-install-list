import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Program, InstallMethod, SettingOs, SettingProgramName } from '../../core/models';
import { MethodBadgeComponent } from '../../shared/method-badge/method-badge.component';
import { IconPickerComponent } from '../../shared/icon-picker/icon-picker.component';
import { ICON_PALETTE } from '../../core/constants';

@Component({
  selector: 'app-programs',
  imports: [FormsModule, NgSelectModule, MethodBadgeComponent, IconPickerComponent],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  programs = signal<Program[]>([]);
  osOptions = signal<SettingOs[]>([]);
  programNameOptions = signal<SettingProgramName[]>([]);
  search = '';
  activeOnly = signal(true);
  showModal = signal(false);
  editing = signal<Program | null>(null);
  saving = signal(false);

  form = {
    name: '',
    osId: null as number | null,
    version: '',
    githubUrl: '',
    methods: [] as InstallMethod[],
    icon: 'ti-database',
    iconBg: ICON_PALETTE[0].bg,
    iconFg: ICON_PALETTE[0].fg,
    note: '',
  };

  readonly methodOptions: InstallMethod[] = ['offline', 'docker', 'online'];

  ngOnInit() {
    this.load();
    this.loadLookups();
  }

  loadLookups() {
    this.api.lookupOs().subscribe((data) => this.osOptions.set(data));
    this.api.lookupProgramNames().subscribe((data) => this.programNameOptions.set(data));
  }

  load() {
    const includeDeleted = !this.activeOnly();
    this.api.getPrograms(this.search || undefined, includeDeleted).subscribe((data) => {
      this.programs.set(
        includeDeleted ? data : data.filter((p) => !this.isDeleted(p)),
      );
    });
  }

  isDeleted(program: Program): boolean {
    return Number(program.isDelete) === 1;
  }

  toggleFilter(active: boolean) {
    this.activeOnly.set(active);
    this.load();
  }

  openCreate() {
    this.editing.set(null);
    this.form = {
      name: '',
      osId: null,
      version: '',
      githubUrl: '',
      methods: [],
      icon: 'ti-database',
      iconBg: ICON_PALETTE[0].bg,
      iconFg: ICON_PALETTE[0].fg,
      note: '',
    };
    this.loadLookups();
    this.showModal.set(true);
  }

  openEdit(program: Program) {
    this.editing.set(program);
    this.form = {
      name: program.name,
      osId: program.osId ?? null,
      version: program.version ?? '',
      githubUrl: program.githubUrl,
      methods: [...program.methods],
      icon: program.icon,
      iconBg: program.iconBg,
      iconFg: program.iconFg,
      note: program.note ?? '',
    };
    this.loadLookups();
    this.showModal.set(true);
  }

  toggleMethod(method: InstallMethod) {
    const idx = this.form.methods.indexOf(method);
    if (idx >= 0) {
      this.form.methods.splice(idx, 1);
    } else {
      this.form.methods.push(method);
    }
  }

  onIconChange(data: { icon: string; iconBg: string; iconFg: string }) {
    this.form.icon = data.icon;
    this.form.iconBg = data.iconBg;
    this.form.iconFg = data.iconFg;
  }

  save() {
    if (!this.form.name || !this.form.githubUrl || !this.form.methods.length) return;
    this.saving.set(true);

    const obs = this.editing()
      ? this.api.updateProgram(this.editing()!.id, this.form)
      : this.api.createProgram(this.form);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteProgram(program: Program) {
    if (!confirm(`ลบ program "${program.name}"?`)) return;
    this.api.deleteProgram(program.id).subscribe(() => this.load());
  }

  toggleActive(program: Program) {
    const next = !program.isActive;
    const action = next ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    if (!confirm(`${action} program "${program.name}"?`)) return;
    this.api.toggleProgramActive(program.id, next).subscribe(() => this.load());
  }

  isActive(program: Program): boolean {
    return !!program.isActive;
  }

  canWrite(): boolean {
    return this.auth.canWrite();
  }

  truncateUrl(url: string): string {
    return url.length > 40 ? url.slice(0, 40) + '...' : url;
  }
}
