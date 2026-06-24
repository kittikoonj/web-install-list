import { SetMetadata } from '@nestjs/common';

export const MENU_KEY_META = 'menu_key';

export const RequireMenu = (menuKey: string) =>
  SetMetadata(MENU_KEY_META, menuKey);
