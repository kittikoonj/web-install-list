import { Component, Input } from '@angular/core';
import { ROLE_BADGE } from '../../core/constants';

@Component({
  selector: 'app-role-badge',
  template: `<span class="badge" [style.background]="colors.bg" [style.color]="colors.fg">{{ label }}</span>`,
})
export class RoleBadgeComponent {
  @Input({ required: true }) roleName!: string;
  @Input({ required: true }) label!: string;

  get colors() {
    return ROLE_BADGE[this.roleName] ?? ROLE_BADGE['viewer'];
  }
}
