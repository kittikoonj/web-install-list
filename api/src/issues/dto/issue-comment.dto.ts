import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIssueCommentDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
