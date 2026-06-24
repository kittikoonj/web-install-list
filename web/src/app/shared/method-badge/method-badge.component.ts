import { Component, Input } from '@angular/core';
import { METHOD_BADGE } from '../../core/constants';
import { InstallMethod } from '../../core/models';

@Component({
  selector: 'app-method-badge',
  template: `<span class="badge" [style.background]="colors.bg" [style.color]="colors.fg">{{ colors.label }}</span>`,
})
export class MethodBadgeComponent {
  @Input({ required: true }) method!: InstallMethod;

  get colors() {
    return METHOD_BADGE[this.method] ?? METHOD_BADGE['offline'];
  }
}
