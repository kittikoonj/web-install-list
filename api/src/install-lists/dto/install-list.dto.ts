import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InstallListItemDto {
  @IsNotEmpty()
  programId: number;

  @IsIn(['offline', 'docker', 'online'])
  method: 'offline' | 'docker' | 'online';
}

export class InstallListCustomerDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  installerName: string;

  @IsDateString()
  installedAt: string;

  @IsOptional()
  @IsUrl()
  testCaseUrl?: string;
}

export class CreateInstallListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallListItemDto)
  items: InstallListItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallListCustomerDto)
  customers?: InstallListCustomerDto[];
}

export class UpdateInstallListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallListItemDto)
  items: InstallListItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallListCustomerDto)
  customers?: InstallListCustomerDto[];
}

export class CloneInstallListDto {
  @IsOptional()
  @IsString()
  name?: string;
}
