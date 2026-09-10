import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { UserPlatformsRepository } from "./user-platforms.repository";
import { CreateUserPlatformDto } from "./dto/create-user-platform.dto";
import { UserPlatformWithPlatform } from "./interfaces/user-platform-with-platform.interface";
import * as speakeasy from "speakeasy";
import { I18nService } from "../i18n/i18n.service";

@Injectable()
export class UserPlatformsService {
  constructor(
    private readonly userPlatformsRepository: UserPlatformsRepository,
    private readonly i18nService: I18nService,
  ) {}

  async findAllByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UserPlatformWithPlatform[]; total: number; hasMore: boolean }> {
    return this.userPlatformsRepository.findAllByUserId(userId, page, limit);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<UserPlatformWithPlatform> {
    const userPlatform = await this.userPlatformsRepository.findById(id);
    if (!userPlatform) {
      throw new NotFoundException(
        this.i18nService.translate("user_platforms.not_found"),
      );
    }
    if (userPlatform.userId !== userId) {
      throw new ForbiddenException(
        this.i18nService.translate("common.forbidden"),
      );
    }
    return userPlatform;
  }

  async create(
    userId: string,
    createUserPlatformDto: CreateUserPlatformDto,
  ): Promise<UserPlatformWithPlatform> {
    if (!userId) {
      throw new Error("UserId is required");
    }

    const existingBinding =
      await this.userPlatformsRepository.findByUserPlatformAndAccount(
        userId,
        createUserPlatformDto.platformId,
        createUserPlatformDto.accountName,
      );

    if (existingBinding) {
      throw new ConflictException(
        this.i18nService.translate("user_platforms.already_exists"),
      );
    }

    return this.userPlatformsRepository.create({
      userId,
      platformId: createUserPlatformDto.platformId,
      accountName: createUserPlatformDto.accountName,
      secret: createUserPlatformDto.secret,
    });
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<CreateUserPlatformDto>,
  ): Promise<UserPlatformWithPlatform> {
    await this.findById(id, userId);
    return this.userPlatformsRepository.update(id, updateData);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);
    await this.userPlatformsRepository.delete(id);
  }

  async generateOTP(
    id: string,
    userId: string,
  ): Promise<{ token: string; expiresIn: number }> {
    await this.findById(id, userId);
    const secret = await this.userPlatformsRepository.getDecryptedSecret(id);

    const token = speakeasy.totp({
      secret: secret,
      encoding: "base32",
    });

    // Calculate remaining time in 30-second cycle for current time
    const currentTime = Math.floor(Date.now() / 1000); // Current timestamp (seconds)
    const timeStep = 30; // TOTP time step (seconds)
    const remainingTime = timeStep - (currentTime % timeStep);

    return { token, expiresIn: remainingTime };
  }

  async verifyOTP(id: string, userId: string, token: string): Promise<boolean> {
    await this.findById(id, userId);
    const secret = await this.userPlatformsRepository.getDecryptedSecret(id);

    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1,
    });
  }
}
