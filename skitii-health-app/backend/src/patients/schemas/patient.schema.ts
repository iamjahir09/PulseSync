import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true })
  name!: string;        // ✅ ! add karo

  @Prop({ required: true, unique: true })
  email!: string;       // ✅ ! add karo

  @Prop()
  phone?: string;       // ✅ ? add karo

  @Prop()
  dateOfBirth?: string; // ✅ ? add karo

  @Prop()
  gender?: string;      // ✅ ? add karo

  @Prop()
  address?: string;     // ✅ ? add karo

  @Prop({ default: true })
  isActive!: boolean;   // ✅ ! add karo

  @Prop()
  medicalHistory?: string; // ✅ ? add karo

  @Prop({ default: Date.now })
  registeredAt!: Date;  // ✅ ! add karo
}

export const PatientSchema = SchemaFactory.createForClass(Patient);