import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UserPlatformsService } from "./user-platforms.service";
import { BatchOtpDto } from "./dto/batch-otp.dto";
import { CreateUserPlatformDto } from "./dto/create-user-platform.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import type { TokenPayload } from "../auth/interfaces/token-payload.interface";

@Controller("user-platforms")
@UseGuards(JwtAuthGuard)
export class UserPlatformsController {
  constructor(private readonly userPlatformsService: UserPlatformsService) {}

  @Get()
  async findAll(
    @GetUser() user: TokenPayload,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("search") search: string = "",
  ) {
    return this.userPlatformsService.findAllByUserId(
      user.sub,
      parseInt(page),
      parseInt(limit),
      search.trim().slice(0, 200),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserPlatformDto: CreateUserPlatformDto,
    @GetUser() user: TokenPayload,
  ) {
    return this.userPlatformsService.create(user.sub, createUserPlatformDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @GetUser() user: TokenPayload) {
    return this.userPlatformsService.delete(id, user.sub);
  }

  @Post("otp/batch")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @HttpCode(HttpStatus.OK)
  async generateBatchOTP(
    @Body() body: BatchOtpDto,
    @GetUser() user: TokenPayload,
  ) {
    return this.userPlatformsService.generateBatchOTP(body.ids, user.sub);
  }

  @Post(":id/otp")
  @HttpCode(HttpStatus.OK)
  async generateOTP(@Param("id") id: string, @GetUser() user: TokenPayload) {
    return this.userPlatformsService.generateOTP(id, user.sub);
  }
}
