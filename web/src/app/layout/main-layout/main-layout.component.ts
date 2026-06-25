import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MENU_ITEMS } from '../../core/constants';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;
  readonly menus = this.auth.menus;
  showPasswordModal = signal(false);
  passwordSaving = signal(false);
  passwordError = signal('');
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

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

  openPasswordModal() {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    this.passwordError.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  savePassword() {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;
    if (!currentPassword || !newPassword) {
      this.passwordError.set('กรุณากรอกรหัสผ่านให้ครบ');
      return;
    }
    if (newPassword.length < 6) {
      this.passwordError.set('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.passwordError.set('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    this.passwordSaving.set(true);
    this.passwordError.set('');
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.closePasswordModal();
        alert('เปลี่ยนรหัสผ่านสำเร็จ');
      },
      error: (err) => {
        this.passwordSaving.set(false);
        this.passwordError.set(err.error?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      },
    });
  }
}
