import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    req.session.userId = user.id;
    const menus = await this.authService.getMenuPermissions(
      user.roleId,
      user.role.name,
    );

    return {
      user: this.authService.sanitizeUser(user),
      menus,
    };
  }

  @Post('logout')
  logout(@Req() req: Request) {
    return new Promise<{ ok: boolean }>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve({ ok: true });
      });
    });
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async me(@CurrentUser() user: User) {
    const menus = await this.authService.getMenuPermissions(
      user.roleId,
      user.role.name,
    );
    return {
      user: this.authService.sanitizeUser(user),
      menus,
    };
  }

  @Post('change-password')
  @UseGuards(SessionGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { ok: true };
  }
}
