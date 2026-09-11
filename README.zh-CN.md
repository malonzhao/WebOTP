# WebOTP

[English](README.md) | 简体中文

一个用于管理 OTP（一次性密码）的 Web 应用。系统由 NestJS 后端 API 和支持国际化的 React 前端界面组成。

<p align="center">
  <a href="https://github.com/malonzhao/WebOTP/stargazers"><img src="https://img.shields.io/github/stars/malonzhao/WebOTP" alt="GitHub Star 数"></a>
  <a href="https://github.com/malonzhao/WebOTP/forks"><img src="https://img.shields.io/github/forks/malonzhao/WebOTP" alt="GitHub Fork 数"></a>
  <a href="https://github.com/malonzhao/WebOTP/issues"><img src="https://img.shields.io/github/issues/malonzhao/WebOTP" alt="GitHub 开放 Issue 数"></a>
</p>

![应用截图](assets/screenshot.png)

产品名称为 **WebOTP**。包名、导入路径、容器名称和镜像仓库使用小写标识符 `webotp`。

徽章通过 Shields.io 刷新，可能存在缓存；可通过上述链接查看仓库详情。

## 🌟 功能

- **用户认证**
    - 基于 JWT 的安全认证
- **平台管理**
    - 创建和管理认证平台
    - 将用户账号关联到平台
- **国际化**
    - 支持多种语言（英语、简体中文、繁体中文）
    - 支持语言切换
- **现代化界面**
    - 响应式仪表盘界面
    - 支持主题

## 🛠 技术栈

### 后端 (apps/api)
- **框架**：NestJS 11
- **数据库**：Prisma .prisma 与 Sqlite
- **认证**：JWT、Passport.js、speakeasy (OTP)
- **校验**：class-validator、class-transformer
- **测试**：Jest、Supertest
- **其他**：i18n、Helmet 安全响应头

### 前端 (apps/web)
- **框架**：React 19
- **状态管理**：Zustand
- **样式**：Tailwind CSS、Headless UI
- **路由**：React Router 7
- **国际化**：i18next
- **HTTP 客户端**：Axios
- **构建工具**：Vite

### 共享技术
- TypeScript
- Monorepo 结构（pnpm workspace）
- ESLint + Prettier
- 使用 Jest 进行测试

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

### 从旧命名迁移

原有的 `web-otp` 容器/服务及镜像引用已替换为 `webotp`。工作区包从 `@web-otp/*` 迁移至 `@webotp/*`，请相应更新本地脚本。更新后的工作流不会发布旧包别名和旧镜像标签。

升级前，请记录旧容器的镜像 ID 和仓库摘要（如有）、原始数据目录、端口、环境变量值以及 Compose 项目名称。在本地保留旧镜像以便回滚。保留实际使用的 `ENCRYPTION_KEY`、`JWT_SECRET` 和 `JWT_REFRESH_SECRET`；新的示例值不能替代原有密钥。数据库路径和格式保持不变。

**Compose 部署**

在现有部署的 `docker` 目录中执行以下步骤。将下文所有 `EXISTING_PROJECT` 替换为原有的 Compose 项目名称。替换旧配置前，在同一目录保存一份受保护的副本，以确保相对数据路径仍然有效：

```bash
cp docker-compose.yaml compose.previous.yaml
chmod 600 compose.previous.yaml
docker inspect --format '{{.Image}}' web-otp
docker image inspect --format '{{json .RepoDigests}}' OLD_IMAGE_ID
docker pull ghcr.io/malonzhao/webotp:latest
```

将 `OLD_IMAGE_ID` 替换为记录的镜像 ID。如果拉取新镜像失败，请等待镜像发布，并保持旧服务运行。在保存的配置中，将镜像固定为记录的旧摘要或镜像 ID，以便回滚。

使用新配置替换当前 Compose 文件，同时保留实际环境变量值、原始卷源路径以及所有自定义端口。仅使用 Compose `.env` 文件无法覆盖 `environment` 中的字面值；请修改这些条目，或保留现有的变量插值/覆盖配置。如有现有的覆盖文件，也应在命令中包含它们。随后停止旧服务，在停止期间备份数据，再启动新服务：

```bash
docker compose -p EXISTING_PROJECT -f compose.previous.yaml stop web-otp
tar -czf "otp-data-before-rename-$(date +%Y%m%d-%H%M%S).tgz" -C ./data .
docker compose -p EXISTING_PROJECT -f docker-compose.yaml up -d webotp
```

如果实际数据目录不是 `./data`，请在备份命令中使用实际目录。妥善保管备份，避免公开。在配置的 URL 上确认登录、现有绑定和 OTP 生成功能正常。在验证新部署前，保持旧容器停止；迁移期间切勿让两个容器同时使用同一数据库，也不要使用 `down -v`。

如需回滚，请先停止新服务，再使用相同的数据和密钥启动旧配置：

```bash
docker compose -p EXISTING_PROJECT -f docker-compose.yaml stop webotp
docker compose -p EXISTING_PROJECT -f compose.previous.yaml up -d web-otp
```

**独立的 `docker run` 部署**

按上述方式记录镜像 ID/摘要，并在停止旧容器前成功拉取新镜像。将实际环境变量值保存到仓库外的私密文件中，例如权限为 `600` 的 `/absolute/path/retained.env`。停止 `web-otp`，在停止期间备份其原始数据目录，然后使用相同的挂载、端口和环境变量启动新容器：

```bash
docker stop web-otp
tar -czf "otp-data-before-rename-$(date +%Y%m%d-%H%M%S).tgz" -C /absolute/path/data .
docker run -d --name webotp --env-file /absolute/path/retained.env \
  -p 8080:8080 -v /absolute/path/data:/root/.otp \
  ghcr.io/malonzhao/webotp:latest
```

将绝对路径和端口映射替换为旧部署使用的值，并保留其他自定义运行选项。保留旧容器以便回滚。如果验证失败，先运行 `docker stop webotp`，再运行 `docker start web-otp`。如果需要恢复数据库，只能在两个容器均已停止时恢复备份。在确定不再需要回滚之前，不要删除旧容器或旧镜像。

## 🚀 开发

### 前置条件
- Node.js v22+
- pnpm v10+

### 设置步骤
1. 安装依赖：
```bash
pnpm install
```

2. 生成 prisma ORM 文件
```bash
pnpm -F @webotp/api prisma:generate
```

3. 设置环境变量：
```bash
cp apps/api/.env.example apps/api/.env
# 编辑 .env，配置数据库连接
```

4. 运行数据库迁移：
```bash
pnpm -F @webotp/api db:migrate
```

5. 执行种子数据填充：
```bash
pnpm -F @webotp/api db:seed
```

## 🏃‍♂️ 运行应用

在不同终端中启动两个服务：

```bash
pnpm dev
```

应用可通过以下地址访问：
- API：`http://localhost:3000`
- Web：`http://localhost:5173`

默认账号凭据：`admin` / `admin123`

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
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'feat: Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 发起 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件。
