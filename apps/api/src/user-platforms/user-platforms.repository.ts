import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma.service";
import { UserPlatformWithPlatform } from "./interfaces/user-platform-with-platform.interface";

@Injectable()
export class UserPlatformsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly algorithm = "aes-256-gcm";
  private readonly key = (() => {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }
    const key = Buffer.from(encryptionKey, "utf8");
    if (key.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be exactly 32 bytes long");
    }
    return key;
  })();

  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(secret, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
  }

  private decryptSecret(encryptedSecret: string): string {
    const [ivHex, encrypted, authTagHex] = encryptedSecret.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async findAllByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UserPlatformWithPlatform[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userPlatform.findMany({
        where: { userId },
        include: { platform: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.userPlatform.count({
        where: { userId },
      }),
    ]);

    return { data, total, hasMore: skip + data.length < total };
  }

  async findById(id: string): Promise<UserPlatformWithPlatform | null> {
    return this.prisma.userPlatform.findUnique({
      where: { id },
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform | null>;
  }

  async findByUserAndPlatform(
    userId: string,
    platformId: string,
  ): Promise<UserPlatformWithPlatform | null> {
    return this.prisma.userPlatform.findFirst({
      where: { userId, platformId },
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform | null>;
  }

  async findByUserPlatformAndAccount(
    userId: string,
    platformId: string,
    accountName: string,
  ): Promise<UserPlatformWithPlatform | null> {
    return this.prisma.userPlatform.findFirst({
      where: {
        userId,
        platformId,
        accountName,
      },
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform | null>;
  }

  async create(data: {
    userId: string;
    platformId: string;
    accountName: string;
    secret: string;
  }): Promise<UserPlatformWithPlatform> {
    if (!data.userId) {
      throw new Error("UserId is required");
    }
    const encryptedSecret = this.encryptSecret(data.secret);
    return this.prisma.userPlatform.create({
      data: {
        user: { connect: { id: data.userId } },
        platform: { connect: { id: data.platformId } },
        accountName: data.accountName,
        encryptedSecret,
      },
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform>;
  }

  async update(
    id: string,
    data: {
      accountName?: string;
      secret?: string;
    },
  ): Promise<UserPlatformWithPlatform> {
    const updateData: any = {};
    if (data.accountName) {
      updateData.accountName = data.accountName;
    }
    if (data.secret) {
      updateData.encryptedSecret = this.encryptSecret(data.secret);
    }
    return this.prisma.userPlatform.update({
      where: { id },
      data: updateData,
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform>;
  }

  async delete(id: string): Promise<UserPlatformWithPlatform> {
    return this.prisma.userPlatform.delete({
      where: { id },
      include: { platform: true },
    }) as Promise<UserPlatformWithPlatform>;
  }

  async getDecryptedSecret(id: string): Promise<string> {
    const userPlatform = await this.prisma.userPlatform.findUnique({
      where: { id },
    });
    if (!userPlatform) {
      throw new Error("User platform not found");
    }
    return this.decryptSecret(userPlatform.encryptedSecret);
  }
}
