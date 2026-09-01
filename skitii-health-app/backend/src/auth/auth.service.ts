import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

// ✅ Simple users - plain password (no hash)
const mockUsers = [
  {
    id: '1',
    email: 'admin@skitii.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
  },
];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Find user by email
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // ✅ Simple password check - no bcrypt
    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Remove password before returning
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}