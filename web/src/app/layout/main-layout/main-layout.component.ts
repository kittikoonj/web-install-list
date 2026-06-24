import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MENU_ITEMS } from '../../core/constants';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;
  readonly menus = this.auth.menus;

  readonly menuSections = computed(() => {
    const sections = ['หลัก', 'จัดการ', 'ระบบ'];
    return sections.map((section) => ({
      section,
      items: MENU_ITEMS.filter(
        (item) => item.section === section && this.auth.canAccess(item.key),
      ),
    })).filter((s) => s.items.length > 0);
  });

  logout() {
    this.auth.logout().subscribe();
  }
}
