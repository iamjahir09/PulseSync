import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const newSession = new this.sessionModel(createSessionDto);
    return newSession.save();
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionModel.findById(id).exec();
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async findByPatient(patientId: string): Promise<Session[]> {
    return this.sessionModel
      .find({ patientId })
      .sort({ startTime: -1 })
      .exec();
  }

  async updateSession(id: string, updateData: Partial<Session>): Promise<Session> {
    const session = await this.sessionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async addReading(id: string, reading: any): Promise<Session> {
    const session = await this.findOne(id) as SessionDocument;
    session.readings.push(reading);
    return session.save();    // ✅ ab ye kaam karega
  }

  async endSession(id: string, endTime: Date): Promise<Session> {
    const session = await this.findOne(id) as SessionDocument;
    session.endTime = endTime;
    session.status = 'ended';
    session.durationSeconds = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 1000
    );
    
    const hrValues = session.readings.map(r => r.heartRate).filter(Boolean);
    if (hrValues.length > 0) {
      session.averageHeartRate = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
      session.maxHeartRate = Math.max(...hrValues);
      session.minHeartRate = Math.min(...hrValues);
    }
    
    return session.save();    // ✅ ab ye kaam karega
  }

  async getActiveSessions(): Promise<Session[]> {
    return this.sessionModel
      .find({ status: { $in: ['active', 'paused'] } })
      .exec();
  }
}