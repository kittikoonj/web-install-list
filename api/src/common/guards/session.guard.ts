import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MENU_KEY_META } from '../decorators/require-menu.decorator';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session;

    if (!session?.userId) {
      throw new UnauthorizedException('กรุณาเข้าสู่ระบบ');
    }

    const user = await this.authService.findUserById(session.userId);
    if (!user || user.isDelete || user.status === 'inactive') {
      throw new UnauthorizedException('บัญชีถูกระงับหรือไม่พบ');
    }

    request.user = user;

    const method = request.method.toUpperCase();
    const url: string = request.originalUrl ?? request.url;
    const viewerWriteAllowed =
      url.includes('/auth/logout') || url.includes('/auth/change-password');
    if (
      user.role.name === 'viewer' &&
      !['GET', 'HEAD'].includes(method) &&
      !viewerWriteAllowed
    ) {
      throw new ForbiddenException('บัญชี Viewer มีสิทธิ์ดูอย่างเดียว');
    }

    const menuKey = this.reflector.getAllAndOverride<string>(MENU_KEY_META, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (menuKey) {
      const hasAccess = await this.authService.canAccessMenu(
        user.roleId,
        user.role.name,
        menuKey,
      );
      if (!hasAccess) {
        throw new UnauthorizedException('ไม่มีสิทธิ์เข้าถึง');
      }
    }

    return true;
  }
}
