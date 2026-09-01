import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId!: Types.ObjectId;      // ✅ ! add karo

  @Prop({ required: true })
  patientName!: string;            // ✅ ! add karo

  @Prop({ required: true })
  bleDeviceId!: string;            // ✅ ! add karo

  @Prop({ required: true })
  bleDeviceName!: string;          // ✅ ! add karo

  @Prop({ required: true })
  startTime!: Date;                // ✅ ! add karo

  @Prop()
  endTime?: Date;                  // ✅ ? add karo

  @Prop({ default: 0 })
  durationSeconds!: number;        // ✅ ! add karo

  @Prop({ default: 'active' })
  status!: 'active' | 'paused' | 'ended' | 'offline';  // ✅ ! add karo

  @Prop({ type: [Object], default: [] })
  readings!: {                     // ✅ ! add karo
    timestamp: Date;
    heartRate: number;
    rrIntervals?: number[];
  }[];

  @Prop()
  averageHeartRate?: number;       // ✅ ? add karo

  @Prop()
  maxHeartRate?: number;           // ✅ ? add karo

  @Prop()
  minHeartRate?: number;           // ✅ ? add karo

  @Prop({ default: false })
  isSynced!: boolean;              // ✅ ! add karo

  @Prop()
  syncAttempts?: number;           // ✅ ? add karo

  @Prop()
  notes?: string;                  // ✅ ? add karo
}

export const SessionSchema = SchemaFactory.createForClass(Session);