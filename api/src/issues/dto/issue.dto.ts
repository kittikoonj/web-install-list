import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
type IssueStatusDto = (typeof ISSUE_STATUSES)[number];

export class CreateIssueDto {
  @IsInt()
  @Min(1)
  installListId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(ISSUE_STATUSES)
  status?: IssueStatusDto;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  installListId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(ISSUE_STATUSES)
  status?: IssueStatusDto;
}
