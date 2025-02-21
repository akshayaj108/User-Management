import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entity/user.entities';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async createUser(
    email: string,
    password: string,
    role: UserRole = UserRole.USER,
  ) {
    const isUserExist = await this.findByEmail(email);

    if (isUserExist) {
      return 'You email account is already exist';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = this.jwtService.sign(
      { email },
      { secret: process.env.JWT_SECRET, expiresIn: '1h' },
    );
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      role,
      verificationToken,
    });
    await this.userRepo.save(user);
    const verificationLink = `http://localhost:${process.env.PORT}/auth/verify/${verificationToken}`;
    await this.mailService.sendMail(
      email,
      'Verify Your Email',
      `Copy and use the token to verify: ${verificationToken}`,
    );

    return 'User created successfully, check email for verfication';
  }

  async verifyUser(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({
        where: { email: decoded.email },
      });
      if (!user) return 'Invalid token';

      user.isVerified = true;
      user.verificationToken = '';
      await this.userRepo.save(user);

      return { message: 'Email verified successfully' };
    } catch (error) {
      return 'Invalid or expired token';
    }
  }
  //reset password
  async requestForResetPassword(email: string) {
    const user = await this.findByEmail(email);
    if (!user) return 'User not found';

    const tokenForReset = this.jwtService.sign({ email }, { expiresIn: '30m' });
    user.resetToken = tokenForReset;

    // const resetPasswordLink = `http://localhost:${process.env.PORT}/auth/reset-password/:${tokenForReset}`;

    await this.mailService.sendMail(
      email,
      'Reset Password',
      `Copy and use token to verify: ${tokenForReset} `,
    );
    await this.userRepo.save(user);
    return {
      message: 'Check your mail, Copy the token',
    };
  }

  //reset password by verifying
  async resetPassword(token: string, newPassword: string) {
    try {
      const decodeUser = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({
        where: { email: decodeUser.email, resetToken: token },
      });
      if (!user) return 'Invalid or expired token';

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetToken = '';
      await this.userRepo.save(user);
      return { message: 'Password reset successfully' };
    } catch (error) {
      console.log('error', error);
      return 'Invalid or expired token';
    }
  }
  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'isVerified', 'isActive'],
    });
  }

  async getAllUsers() {
    return this.userRepo.find({
      select: ['id', 'email', 'role', 'isVerified', 'isActive'],
    });
  }

  async updateUserRole(id: number, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (user) {
      if (user.role === role) return `This role ${role} is already there`;
    }
    await this.userRepo.update(id, { role });
    return 'User role updated successfilly';
  }

  async deactivateUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) {
      return 'User not found';
    }
    await this.userRepo.update(id, { isActive: false });
    return 'User Status deactivated successfully';
  }
  async activateUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) {
      return 'User not found';
    }
    await this.userRepo.update(id, { isActive: true });
    return 'User Status activated successfully';
  }
  async getDetail(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'isVerified', 'role'],
    });

    if (!user) {
      return 'User not found';
    }

    if (user.role === UserRole.USER) {
      return user;
    } else {
      const { isVerified, ...userWithoutIsVerified } = user;
      return userWithoutIsVerified;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
  async deleteUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });

    if (!user) {
      return 'User not found';
    }

    await this.userRepo.remove(user);
    return 'User deleted successfully';
  }
}
