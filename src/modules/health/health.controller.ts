import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse, HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Check PostgreSQL and Redis connectivity' })
  @ApiOkResponse({ description: 'All infrastructure dependencies are available' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unavailable' })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
