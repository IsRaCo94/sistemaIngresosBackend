import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibretaOrigenController } from './libreta-origen.controller';
import { LibretaOrigenEntity } from './libreta-origen.entity';
import { LibretaOrigenService } from './libreta-origen.service';

@Module({
  imports: [TypeOrmModule.forFeature([LibretaOrigenEntity])],
  providers: [LibretaOrigenService],
  controllers: [LibretaOrigenController]
})
export class LibretaOrigenModule { }
