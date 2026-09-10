import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "../../src/users/users.service";
import { UsersRepository } from "../../src/users/users.repository";
import { User } from "../../generated/prisma";
import { I18nService } from "../../src/i18n/i18n.service";

// Mock the bcrypt module
jest.mock("bcrypt");

// Mock the UsersRepository
const mockUsersRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  activateUser: jest.fn(),
  deactivateUser: jest.fn(),
  count: jest.fn(),
};

describe("UsersService", () => {
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  const mockUser: User = {
    id: "1",
    username: "testuser",
    password: "hashedPassword",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: I18nService, useValue: { translate: (key: string) => key } },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);

    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await usersService.findById("1");

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException if user not found", async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(usersService.findById("1")).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.findById).toHaveBeenCalledWith("1");
    });
  });

  describe("updateUsername", () => {
    const updateData = {
      username: "newuser",
    };

    it("should update user successfully", async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      const updatedUser = {
        ...mockUser,
        ...updateData,
      };
      mockUsersRepository.update.mockResolvedValue(updatedUser);

      const result = await usersService.updateUsername("1", updateData.username);

      expect(usersRepository.findByUsername).toHaveBeenCalledWith(
        updateData.username,
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersRepository.update).toHaveBeenCalledWith("1", {
        ...updateData,
      });
      expect(result).toEqual(updatedUser);
    });


    it("should throw ConflictException if new username exists", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue({
        ...mockUser,
        id: "2",
      });

      await expect(
        usersService.updateUsername("1", "existinguser"),
      ).rejects.toThrow(ConflictException);
    });
  });
});
