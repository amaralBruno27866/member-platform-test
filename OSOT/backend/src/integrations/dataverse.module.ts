import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataverseService } from './dataverse.service';
import { RedisService } from '../redis/redis.service';

@Module({
  imports: [HttpModule],
  providers: [DataverseService, RedisService],
  exports: [DataverseService],
})
export class DataverseModule {}
