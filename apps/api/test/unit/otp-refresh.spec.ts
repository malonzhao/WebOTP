import { UserPlatformsService } from "../../src/user-platforms/user-platforms.service";
import { BatchOtpDto } from "../../src/user-platforms/dto/batch-otp.dto";
import { validate } from "class-validator";
import * as speakeasy from "speakeasy";

describe("OTP batch refresh", () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const repository = {
    findById: jest.fn(),
    getDecryptedSecret: jest.fn(),
  };
  const service = new UserPlatformsService(
    repository as any,
    { translate: (key: string) => key } as any,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(59999);
    repository.findById
      .mockReset()
      .mockImplementation(async (id) => ({ id, userId: "owner" }));
    repository.getDecryptedSecret.mockReset().mockResolvedValue(secret);
  });
  afterEach(() => jest.useRealTimers());

  it("uses one time sample after secret retrieval for every code and deadline", async () => {
    repository.getDecryptedSecret.mockImplementation(async () => {
      jest.setSystemTime(60001);
      return secret;
    });
    const batch = await service.generateBatchOTP(["a", "b", "a"], "owner");
    expect(batch.serverTime).toBe(60001);
    expect(batch.expiresAt).toBe(90000);
    expect(batch.items).toHaveLength(2);
    for (const item of batch.items) {
      expect(item.token).toBe(
        speakeasy.totp({ secret, encoding: "base32", time: 60.001 }),
      );
    }
  });

  it("rejects foreign or missing bindings before decrypting secrets", async () => {
    repository.findById
      .mockResolvedValueOnce({ userId: "owner" })
      .mockResolvedValueOnce({ userId: "other" });
    await expect(
      service.generateBatchOTP(["a", "b"], "owner"),
    ).rejects.toThrow();
    expect(repository.getDecryptedSecret).not.toHaveBeenCalled();
    repository.findById.mockResolvedValue(null);
    await expect(
      service.generateBatchOTP(["missing"], "owner"),
    ).rejects.toThrow();
  });

  it("preserves the single-code response and bounds batch input", async () => {
    const single = await service.generateOTP("a", "owner");
    expect(single.expiresIn).toBe(1);
    expect(single.expiresAt).toBe(60000);
    for (const ids of [
      [],
      ["a", "a"],
      [""],
      [123],
      Array.from({ length: 201 }, (_, i) => String(i)),
    ]) {
      const dto = Object.assign(new BatchOtpDto(), { ids });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    }
    expect(
      await validate(Object.assign(new BatchOtpDto(), { ids: ["a", "b"] })),
    ).toHaveLength(0);
  });
});
