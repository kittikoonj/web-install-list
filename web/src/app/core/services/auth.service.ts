import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, MenuPermissions, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;
  readonly currentUser = signal<User | null>(null);
  readonly menus = signal<MenuPermissions>({});

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user);
          this.menus.set(res.menus);
        }),
      );
  }

  logout() {
    return this.http.post(`${this.api}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.menus.set({});
        this.router.navigate(['/login']);
      }),
    );
  }

  loadMe() {
    return this.http.get<AuthResponse>(`${this.api}/me`, { withCredentials: true }).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.menus.set(res.menus);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.menus.set({});
        return of(null);
      }),
    );
  }

  canAccess(menuKey: string): boolean {
    return !!this.menus()[menuKey];
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
