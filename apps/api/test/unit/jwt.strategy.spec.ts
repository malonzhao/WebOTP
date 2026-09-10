import { JwtStrategy } from "../../src/auth/strategies/jwt.strategy";
import { AuthRepository } from "../../src/auth/auth.repository";

describe("JWT user validation", () => {
  const originalSecret = process.env.JWT_SECRET;
  const findUserById = jest.fn();

  beforeEach(() => {
    process.env.JWT_SECRET = "test-only-signing-secret";
    findUserById.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const strategy = () => new JwtStrategy({ findUserById } as unknown as AuthRepository);

  it.each([null, { id: "1", isActive: false }])("rejects unavailable users: %p", async (user) => {
    findUserById.mockResolvedValue(user);
    await expect(strategy().validate({ sub: "1", username: "old" })).resolves.toBe(false);
  });

  it("uses the current username for an active user with an older token", async () => {
    findUserById.mockResolvedValue({ id: "1", username: "new", isActive: true });
    await expect(strategy().validate({ sub: "1", username: "old" }))
      .resolves.toEqual({ sub: "1", username: "new" });
    expect(findUserById).toHaveBeenCalledWith("1");
  });

  it("fails without a configured signing secret", () => {
    delete process.env.JWT_SECRET;
    expect(strategy).toThrow();
  });
});
