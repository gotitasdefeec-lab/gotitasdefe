import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'admin@tienda.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
