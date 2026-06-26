import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMasterNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
