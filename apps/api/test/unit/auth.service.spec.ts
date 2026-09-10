import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../src/auth/auth.service";
import { AuthRepository } from "../../src/auth/auth.repository";
import { LoginDto } from "../../src/auth/dto/login.dto";
import { TokensDto } from "../../src/auth/dto/tokens.dto";
import { I18nService } from "../../src/i18n/i18n.service";

// Mock the bcrypt module
jest.mock("bcrypt");

// Mock the AuthRepository
const mockAuthRepository = {
  findUserByUsername: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  updateRefreshToken: jest.fn(),
};

// Mock the JwtService
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: I18nService, useValue: { translate: (key: string) => key } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      username: "testuser",
      password: "password123",
    };

    const mockUser = {
      id: "1",
      password: "hashedPassword",
      username: "testuser",
      isActive: true,
    };

    const mockTokens: TokensDto = {
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    };

    it("should login successfully with valid credentials", async () => {
      // Mock the repository to return a user
      mockAuthRepository.findUserByUsername.mockResolvedValue(mockUser);
      // Mock bcrypt to return true for password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // Mock the generateTokens method (private method, so we mock the jwtService.sign)
      mockJwtService.sign.mockReturnValueOnce("accessToken");
      mockJwtService.sign.mockReturnValueOnce("refreshToken");
      // Mock the updateRefreshToken method
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(authRepository.findUserByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "refreshToken",
      );
      expect(result).toEqual(mockTokens);
    });

    it("should reject disabled users before checking credentials or issuing tokens", async () => {
      mockAuthRepository.findUserByUsername.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockAuthRepository.updateRefreshToken).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockAuthRepository.findUserByUsername.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authRepository.findUserByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      mockAuthRepository.findUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authRepository.findUserByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });

  describe("refreshToken", () => {
    const refreshToken = "validRefreshToken";
    const payload = {
      sub: "1",
      username: "testuser",
    };

    const mockUser = {
      id: "1",
      username: "testuser",
      refreshToken: "validRefreshToken",
      isActive: true,
    };

    const mockTokens: TokensDto = {
      accessToken: "newAccessToken",
      refreshToken: "newRefreshToken",
    };

    it("should refresh tokens successfully with valid refresh token", async () => {
      // Mock jwtService.verify to return payload
      mockJwtService.verify.mockReturnValue(payload);
      // Mock findUserById to return user with matching refresh token
      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      // Mock jwtService.sign for new tokens
      mockJwtService.sign.mockReturnValueOnce("newAccessToken");
      mockJwtService.sign.mockReturnValueOnce("newRefreshToken");
      // Mock updateRefreshToken
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      });
      expect(authRepository.findUserById).toHaveBeenCalledWith(payload.sub);
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "newRefreshToken",
      );
      expect(result).toEqual(mockTokens);
    });

    it("should reject disabled users without issuing or storing new tokens", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.findUserById.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockAuthRepository.updateRefreshToken).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.refreshToken("invalidToken")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if refresh token does not match", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.findUserById.mockResolvedValue({
        ...mockUser,
        refreshToken: "differentToken",
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    const refreshToken = "validRefreshToken";
    const payload = {
      sub: "1",
      username: "testuser",
    };

    it("should logout successfully with valid refresh token", async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
      });
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        payload.sub,
        null,
      );
    });

    it("should not throw error if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.logout("invalidToken")).resolves.not.toThrow();
      expect(authRepository.updateRefreshToken).not.toHaveBeenCalled();
    });
  });
});
