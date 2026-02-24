import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('🔑 Login iniciado para:', loginDto.email);
    
    const admin = await this.prisma.admin.findUnique({
      where: { email: loginDto.email },
    });

    if (!admin) {
      console.log('❌ Usuario no encontrado:', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ Usuario encontrado. Hash en BD:', admin.password.substring(0, 20) + '...');
    
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password,
    );

    console.log('🔐 Validación de contraseña:', isPasswordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: admin.id, 
      email: admin.email, 
      name: admin.name,
      tokenVersion: admin.tokenVersion 
    };
    const token = this.jwtService.sign(payload);

    console.log('✅ Login exitoso para:', admin.email);
    
    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      },
    };
  }

  async registerCustomer(registerCustomerDto: RegisterCustomerDto) {
    const { name, email, password } = registerCustomerDto;

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = await this.prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: '', // Default value
        address: '', // Default value
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = newCustomer;
    return result;
  }

  async loginCustomer(loginDto: LoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { email: loginDto.email },
    });

    if (!customer || !customer.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      customer.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: customer.id, email: customer.email, name: customer.name, role: 'customer' };
    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = customer;

    return {
      token,
      customer: user,
    };
  }

  async validateUser(userId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin',
    };
  }

    async changePassword(dto: ChangePasswordDto) {
      const { email, oldPassword, newPassword, confirmPassword } = dto;
      console.log('🔐 Cambio de contraseña iniciado para:', email);
      
      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        console.log('❌ Las contraseñas no coinciden');
        throw new ConflictException('Las contraseñas no coinciden');
      }
      
      const admin = await this.prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        console.log('❌ Usuario no encontrado:', email);
        throw new UnauthorizedException('Usuario no encontrado');
      }
      
      console.log('✅ Usuario encontrado:', admin.email);
      const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
      if (!isPasswordValid) {
        console.log('❌ Contraseña actual incorrecta');
        throw new UnauthorizedException('La contraseña actual es incorrecta');
      }
      
      console.log('✅ Contraseña actual validada');
      if (newPassword.length < 6) {
        throw new ConflictException('La nueva contraseña debe tener al menos 6 caracteres');
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('🔒 Nueva contraseña hasheada:', hashedPassword);
      
      // Incrementar tokenVersion para invalidar todos los tokens anteriores
      const updated = await this.prisma.admin.update({
        where: { email },
        data: { 
          password: hashedPassword,
          tokenVersion: { increment: 1 }
        },
      });
      
      console.log('✅ Contraseña actualizada en BD para admin ID:', updated.id);
      console.log('🔄 Token version incrementado a:', updated.tokenVersion);
      console.log('🚪 Todas las sesiones anteriores han sido invalidadas');
      
      return { message: 'Contraseña cambiada correctamente. Se han cerrado todas las sesiones en otros dispositivos.' };
    }

    async verifyPassword(dto: VerifyPasswordDto) {
      const { email, password } = dto;
      console.log('🔍 Verificando contraseña para:', email);
      console.log('🔑 Contraseña recibida (length):', password.length);
      
      const admin = await this.prisma.admin.findUnique({ where: { email } });
      
      if (!admin) {
        console.log('❌ Usuario no encontrado:', email);
        throw new UnauthorizedException('Usuario no encontrado');
      }
      
      console.log('✅ Usuario encontrado:', admin.email);
      console.log('🔒 Hash en BD:', admin.password.substring(0, 20) + '...');
      
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      console.log('🔐 Resultado de validación:', isPasswordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }
      
      return { valid: true, message: 'Contraseña correcta' };
    }
}
