import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import * as bcrypt from "bcrypt";
import { User } from '../../generated/prisma';
import { I18nService } from "../i18n/i18n.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly i18nService: I18nService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(
        this.i18nService.translate("users.not_found"),
      );
    }
    return user;
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    // Validate that new password and confirm password match
    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new BadRequestException(
        this.i18nService.translate("auth.password_too_weak"),
      );
    }

    // Get current user
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        this.i18nService.translate("users.not_found"),
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(
        this.i18nService.translate("auth.invalid_current_password"),
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      updatePasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        this.i18nService.translate("auth.password_too_weak"),
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      10,
    );

    // Update password
    await this.usersRepository.update(userId, {
      password: hashedNewPassword,
    });
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    // Check if username is already taken by another user
    const existingUser = await this.usersRepository.findByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      console.error('Username already exists, cannot update');
      throw new ConflictException(
        this.i18nService.translate("users.username_already_exists"),
      );
    }
    // Update username
    return this.usersRepository.update(userId, { username });
  }
}
