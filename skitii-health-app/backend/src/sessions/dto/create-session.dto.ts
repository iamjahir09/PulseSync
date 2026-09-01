import { IsString, IsOptional, IsArray, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsString()
  patientId!: string;       // ✅ ! add karo

  @IsString()
  patientName!: string;     // ✅ ! add karo

  @IsString()
  bleDeviceId!: string;     // ✅ ! add karo

  @IsString()
  bleDeviceName!: string;   // ✅ ! add karo

  @Type(() => Date)
  @IsDate()
  startTime!: Date;         // ✅ ! add karo

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  status?: 'active' | 'paused' | 'ended' | 'offline';

  @IsOptional()
  @IsArray()
  readings?: {
    timestamp: Date;
    heartRate: number;
    rrIntervals?: number[];
  }[];

  @IsOptional()
  @IsNumber()
  averageHeartRate?: number;

  @IsOptional()
  @IsNumber()
  maxHeartRate?: number;

  @IsOptional()
  @IsNumber()
  minHeartRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}