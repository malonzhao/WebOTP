import { UserPlatformsRepository } from "../../src/user-platforms/user-platforms.repository";
import { PrismaService } from "../../src/prisma.service";

describe("User platform pagination and encryption key", () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const findMany = jest.fn();
  const count = jest.fn();
  const repository = () => new UserPlatformsRepository({
    userPlatform: { findMany, count },
  } as unknown as PrismaService);

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(32);
    jest.resetAllMocks();
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it.each([
    [1, 20, 45, true],
    [2, 20, 45, true],
    [3, 5, 45, false],
    [2, 20, 40, false],
    [1, 0, 0, false],
  ])("reports remaining data on page %i with %i rows of %i", async (page, length, total, hasMore) => {
    const data = Array.from({ length }, (_, id) => ({ id }));
    findMany.mockResolvedValue(data);
    count.mockResolvedValue(total);
    await expect(repository().findAllByUserId("user", page, 20))
      .resolves.toEqual({ data, total, hasMore });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user" }, skip: (page - 1) * 20, take: 20,
    }));
  });

  it.each(["a".repeat(31), "a".repeat(33), "中".repeat(32)])("rejects a key that is not 32 bytes", (key) => {
    process.env.ENCRYPTION_KEY = key;
    expect(repository).toThrow("exactly 32 bytes");
  });

  it("accepts a multibyte key totaling exactly 32 bytes", () => {
    process.env.ENCRYPTION_KEY = "中".repeat(10) + "ab";
    expect(repository).not.toThrow();
  });
});
