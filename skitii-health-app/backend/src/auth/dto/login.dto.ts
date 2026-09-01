import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email!: string;    // ✅ ! add karo

  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  password!: string; // ✅ ! add karo
}