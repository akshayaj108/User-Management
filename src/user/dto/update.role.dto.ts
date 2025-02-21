import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entity/user.entities';
import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, description: 'New role of the user' })
  @Transform(({ value }) => value.toString().toLowerCase())
  @IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
  role: UserRole;
}
