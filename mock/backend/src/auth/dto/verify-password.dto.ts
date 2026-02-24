import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({ example: 'admin@tienda.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  password: string;
}
