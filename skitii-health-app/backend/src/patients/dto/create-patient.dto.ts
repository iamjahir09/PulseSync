import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  name!: string;      // ✅ ! add karo

  @IsEmail()
  email!: string;     // ✅ ! add karo

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  medicalHistory?: string;
}