import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Program, InstallMethod } from '../../core/models';
import { MethodBadgeComponent } from '../../shared/method-badge/method-badge.component';
import { IconPickerComponent } from '../../shared/icon-picker/icon-picker.component';
import { ICON_PALETTE } from '../../core/constants';

@Component({
  selector: 'app-programs',
  imports: [FormsModule, MethodBadgeComponent, IconPickerComponent],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent implements OnInit {
  private readonly api = inject(ApiService);

  programs = signal<Program[]>([]);
  search = '';
  showModal = signal(false);
  editing = signal<Program | null>(null);
  saving = signal(false);

  form = {
    name: '',
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
  }

  load() {
    this.api.getPrograms(this.search || undefined, true).subscribe((data) => {
      this.programs.set(data);
    });
  }

  openCreate() {
    this.editing.set(null);
    this.form = {
      name: '',
      version: '',
      githubUrl: '',
      methods: [],
      icon: 'ti-database',
      iconBg: ICON_PALETTE[0].bg,
      iconFg: ICON_PALETTE[0].fg,
      note: '',
    };
    this.showModal.set(true);
  }

  openEdit(program: Program) {
    this.editing.set(program);
    this.form = {
      name: program.name,
      version: program.version ?? '',
      githubUrl: program.githubUrl,
      methods: [...program.methods],
      icon: program.icon,
      iconBg: program.iconBg,
      iconFg: program.iconFg,
      note: program.note ?? '',
    };
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

  truncateUrl(url: string): string {
    return url.length > 40 ? url.slice(0, 40) + '...' : url;
  }
}
