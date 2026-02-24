import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

import { PublicPoliciesController } from './public-policies.controller';

@Module({
  controllers: [PoliciesController, PublicPoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}