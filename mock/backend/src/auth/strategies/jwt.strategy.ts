import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Verificar que el token tenga la versión correcta
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      console.log('❌ Usuario no encontrado en validación JWT');
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Si el token no tiene tokenVersion o no coincide con el de la BD, es inválido
    if (
      payload.tokenVersion === undefined ||
      payload.tokenVersion !== admin.tokenVersion
    ) {
      console.log(
        `🚫 Token inválido - Version en JWT: ${payload.tokenVersion}, Version en BD: ${admin.tokenVersion}`,
      );
      throw new UnauthorizedException(
        'Sesión inválida. Por favor, inicia sesión nuevamente.',
      );
    }

    console.log('✅ Token validado correctamente - Version:', admin.tokenVersion);
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      tokenVersion: payload.tokenVersion,
    };
  }
}
