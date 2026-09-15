# WebOTP

[English](README.md) | 简体中文

一个用于管理 OTP（一次性密码）的 Web 应用。

- **账号管理**：按认证平台组织和管理账号。
- **用户认证**：支持基于 JWT 的登录认证。
- **语言切换**：支持英语、简体中文和繁体中文。
- **响应式界面**：适配不同屏幕尺寸，支持主题切换。

<p align="center">
  <a href="https://github.com/malonzhao/WebOTP/stargazers"><img src="https://img.shields.io/github/stars/malonzhao/WebOTP" alt="GitHub Star 数"></a>
  <a href="https://github.com/malonzhao/WebOTP/forks"><img src="https://img.shields.io/github/forks/malonzhao/WebOTP" alt="GitHub Fork 数"></a>
  <a href="https://github.com/malonzhao/WebOTP/issues"><img src="https://img.shields.io/github/issues/malonzhao/WebOTP" alt="GitHub 开放 Issue 数"></a>
</p>

![应用截图](assets/screenshot.png)

## 🐳 使用方式（Docker 容器）

**快速开始**
```bash
# 使用 Docker Compose 运行（推荐）：
cd docker && docker compose -f docker-compose.yaml up -d
```

```bash
# 也可以使用 Docker 运行：
docker run -d --name webotp \
  -e ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456 \
  -e JWT_SECRET=webotp_secret_key \
  -e JWT_REFRESH_SECRET=webotp_refresh_secret_key \
  -p 8080:8080 \
  -v $(pwd)/data:/root/.otp \
  ghcr.io/malonzhao/webotp:latest
```

打开浏览器并访问 http://localhost:8080 即可使用应用。

**其他环境变量**
```dotenv
# 用于加密敏感 OTP 数据的 32 字节加密密钥
# 请勿在生产环境使用默认密钥，必须修改并妥善保管
ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456

# 用于签署 JWT 访问令牌的密钥
# 生产环境必须使用唯一值，长度应为 32+ 个字符
JWT_SECRET=webotp_secret_key

# 用于签署 JWT 刷新令牌的密钥
# 为确保安全，必须与 JWT_SECRET 不同
JWT_REFRESH_SECRET=webotp_refresh_secret_key

# 访问令牌的过期时间，单位为秒
# 3600s = 1 小时，请根据安全要求调整
JWT_EXPIRES_IN=1800s

# Prisma 格式的 sqlite 数据库连接字符串
DATABASE_URL=file:${HOME}/.otp/otp.db
```

## 🚀 开发

使用 Node.js 22.x 和 pnpm 10.21.0，在仓库根目录执行以下命令。复制环境文件后，先编辑再继续：设置 `NODE_ENV=development`，将 `DATABASE_URL` 指向可写的本地 SQLite 路径，并按上文说明配置 `ENCRYPTION_KEY`、`JWT_SECRET` 和 `JWT_REFRESH_SECRET`。如果已有 `.env`，请保留，不要覆盖。

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env 后，再运行其余命令。
pnpm -F @webotp/api prisma:generate
pnpm -F @webotp/api db:migrate
pnpm -F @webotp/api db:seed
pnpm dev
```

`pnpm dev` 同时启动两个服务：Web 地址为 `http://localhost:5173`，API 地址为 `http://localhost:3000`。种子数据会创建账号 `admin` / `admin123`。

## 🧪 测试

运行指定应用的测试：

```bash
# 后端测试
pnpm --filter @webotp/api test

# 前端测试
pnpm --filter @webotp/web test
```

## 🤝 贡献

更新本 README 时，请同步更新英文和简体中文两个版本。

欢迎贡献！请按以下步骤操作：
1. Fork 本仓库
2. 创建功能分支（`git checkout -b feat/amazing-feature`）
3. 提交更改（`git commit -m 'feat: Add some AmazingFeature'`）
4. 推送到分支（`git push origin feat/amazing-feature`）
5. 发起 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件。
