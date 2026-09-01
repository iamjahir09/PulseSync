import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.sessionsService.findByPatient(patientId);
  }

  @Patch(':id/end')
  endSession(@Param('id') id: string) {
    return this.sessionsService.endSession(id, new Date());
  }

  @Patch(':id/reading')
  addReading(@Param('id') id: string, @Body() body: { reading: any }) {
    return this.sessionsService.addReading(id, body.reading);
  }
}