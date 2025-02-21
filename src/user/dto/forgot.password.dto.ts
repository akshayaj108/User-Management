import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPassDto {
  @ApiProperty({
    description: 'Enter Your Email for the set password',
    minLength: 6,
    example: 'admin.mail@.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
