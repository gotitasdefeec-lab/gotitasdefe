
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';

@ApiTags('public-policies')
@Controller('public/policies')
export class PublicPoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all policies for public view' })
  findAll() {
    return this.policiesService.findAll();
  }
}
