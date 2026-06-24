import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ROLE_DESCRIPTIONS } from '../../core/constants';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  error = signal('');
  loading = signal(false);
  readonly roles = ROLE_DESCRIPTIONS;

  submit() {
    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/install-lists']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message;
        if (err.status === 0) {
          this.error.set('ไม่สามารถเชื่อมต่อ API ได้ — ตรวจสอบว่า api รันอยู่ที่ port 3000');
        } else {
          this.error.set(msg || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
      },
    });
  }
}
