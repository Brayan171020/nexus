import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskAuditResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() taskId!: string;
  @ApiPropertyOptional({ nullable: true }) previousStatus!: string | null;
  @ApiProperty() newStatus!: string;
  @ApiProperty() correlationId!: string;
  @ApiProperty() action!: string;
  @ApiPropertyOptional({ type: Object, nullable: true }) metadata!: Record<string, unknown> | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}
