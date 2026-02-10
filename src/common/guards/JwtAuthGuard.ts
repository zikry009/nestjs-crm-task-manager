import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorators/role.decorator';
import { Role } from '../enums/roles.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super();
  }
  validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get('jwt.secret'),
    });
  }

  /**
   * Validate the token and return the decoded data
   * @param context - The execution context
   * @returns The decoded data
   */
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { authorization }: any = request.headers;
    console.log('authorization - ', authorization);
    if (!authorization || authorization.trim() === '') {
      throw new UnauthorizedException('Unauthorized Access', {
        description: 'Please provide token',
      });
    }
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const authToken: string = authorization.replace(/bearer/gim, '').trim();
    const resp = await this.validateToken(authToken);
    request.decodedData = resp;
    if (!roles) {
      return true;
    }
    if (roles?.length > 0) {
      if (!resp || !roles.includes(resp.role)) {
        throw new ForbiddenException('Forbidden Access', {
          description: 'You are not authorized to access this resource',
        });
      }
      return true;
    }

    return true;
  }
}
