import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Cambiar contraseña de administrador' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  async changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @Post('verify-password')
  @ApiOperation({ summary: 'Verificar contraseña actual del administrador' })
  @ApiResponse({ status: 200, description: 'Contraseña verificada' })
  @ApiResponse({ status: 401, description: 'Contraseña incorrecta' })
  async verifyPassword(@Body() dto: VerifyPasswordDto) {
    return this.authService.verifyPassword(dto);
  }
}