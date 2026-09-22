import { ApiProperty } from '@nestjs/swagger';

export class TaskMetricsDto {
  @ApiProperty() waiting!: number;
  @ApiProperty() active!: number;
  @ApiProperty() completed!: number;
  @ApiProperty() failed!: number;
  @ApiProperty() delayed!: number;
  @ApiProperty() dlq!: number;
  @ApiProperty() totalHistorical!: number;
}
