import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  osId?: number | null;

  @IsOptional()
  @IsString()
  version?: string;

  @IsUrl()
  githubUrl: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['offline', 'docker', 'online'], { each: true })
  methods: ('offline' | 'docker' | 'online')[];

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  iconBg: string;

  @IsString()
  iconFg: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  osId?: number | null;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['offline', 'docker', 'online'], { each: true })
  methods?: ('offline' | 'docker' | 'online')[];

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  iconBg?: string;

  @IsOptional()
  @IsString()
  iconFg?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ToggleProgramActiveDto {
  @IsBoolean()
  isActive: boolean;
}
