import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({ description: 'Customer\'s full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer\'s email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer\'s password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}
