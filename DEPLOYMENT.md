# GPT55-Token-Relay 上线部署操作手册

这份手册用于把 `GPT55-Token-Relay` 从本地项目部署到正式可运营环境。按顺序执行即可。

## 1. 项目概览

项目名称：`GPT55-Token-Relay`

技术栈：

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

核心功能：

- 预付费 Token 中转站
- 用户先充值，系统自动到账
- API 调用前检查余额
- 余额不足直接返回 `402 Payment Required`
- 调用成功后扣除用户 token 余额
- 当前支持 `qwen3.5`
- `gpt-5.5` 等 cxzweb 额度到账后启用

当前上游状态：

- 阿里云百炼：当前主上游，`qwen3.5` 映射到 `qwen3.6-plus`，有 100 万 tokens 免费额度
- cxzweb：API Key 已获取，但暂时无额度，等待 V2EX 评论赠送 17 美元额度
- No.1-API / freemodel：备用上游，默认关闭

商业模式：

```text
用户充值 -> webhook 自动到账 -> 用户调用 API -> 系统调用上游 -> 扣除用户余额 -> 运营者赚取差价
```

目标毛利模型：

```text
上游低成本采购 token
用户按更高单价预付费购买 token
所有调用先检查余额
余额不足不垫资
```

## 2. 上线前准备清单

请先确认以下账号和材料：

- [ ] cxzweb API Key：已获取，但当前无额度
- [ ] 阿里云百炼 API Key：已获取，有 100 万 tokens 免费额度
- [ ] Supabase 账号：需要注册
- [ ] PayPal / Stripe / Coinbase 账号：可选，至少配置 1 个支付方式
- [ ] GitHub 账号：需要注册
- [ ] Vercel 账号：需要注册
- [ ] 一个安全邮箱：用于 admin 用户
- [ ] 一个强密码：用于 Supabase 数据库和 admin 登录
- [ ] 本地已安装 Node.js 20+
- [ ] 本地项目路径：`C:\Users\pro3\Desktop\GPT55-Token-Relay`

## 3. 步骤 1：初始化 Supabase 数据库

### 3.1 注册 Supabase

1. 打开浏览器。
2. 访问 [https://supabase.com](https://supabase.com)。
3. 点击右上角 `Sign Up`。
4. 可以选择 GitHub 登录，也可以使用邮箱注册。
5. 登录后进入 Supabase Dashboard。

### 3.2 创建新项目

1. 在 Supabase Dashboard 点击 `New Project`。
2. 选择你的 Organization。
3. 在 `Project name` 输入：

```text
GPT55-Token-Relay
```

4. 在 `Database Password` 输入一个强密码。
5. 选择离你用户较近的 Region。
6. 点击 `Create new project`。
7. 等待项目初始化完成，通常需要 1 到 3 分钟。

### 3.3 获取 Supabase 环境变量

1. 进入刚创建的 Supabase 项目。
2. 左侧菜单点击 `Project Settings`。
3. 点击 `API`。
4. 复制以下内容：

```text
Project URL
anon public key
service_role key
```

5. 暂时保存到本地安全位置，稍后填入 `.env.local` 和 Vercel 环境变量。

注意：`service_role key` 权限很高，不能放到前端，也不能提交到 GitHub。

### 3.4 创建 admin 用户

1. 左侧菜单点击 `Authentication`。
2. 点击 `Users`。
3. 点击 `Add user`。
4. 输入你的 admin 邮箱。
5. 输入 admin 密码。
6. 勾选或确认邮箱已验证选项。
7. 点击 `Create user`。
8. 创建成功后，复制这个用户的 `User UID`。

### 3.5 修改初始化 SQL 里的 admin 模板

项目根目录有文件：

```text
init-database.sql
```

打开后滑到文件底部，找到这段注释：

```sql
-- insert into public.users (id, email, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin')
-- on conflict (id) do update set role = 'admin';
```

把它改成你的 admin UUID 和邮箱，并去掉前面的 `--`：

```sql
insert into public.users (id, email, role)
values ('你的-Supabase-Auth-User-UUID', '你的邮箱@example.com', 'admin')
on conflict (id) do update set role = 'admin';
```

### 3.6 执行 SQL

1. 回到 Supabase Dashboard。
2. 左侧菜单点击 `SQL Editor`。
3. 点击 `New query`。
4. 打开本地 `init-database.sql`。
5. 全选复制 SQL 内容。
6. 粘贴到 Supabase SQL Editor。
7. 点击 `Run`。
8. 确认没有报错。

### 3.7 验证表是否创建成功

1. 左侧菜单点击 `Table Editor`。
2. 确认能看到以下表：

- [ ] `users`
- [ ] `api_keys`
- [ ] `token_balances`
- [ ] `api_calls`
- [ ] `payments`
- [ ] `upstream_balance`
- [ ] `fund_pool`
- [ ] `upstream_config`
- [ ] `upstream_switch_logs`
- [ ] `system_logs`

3. 打开 `upstream_config`，确认默认数据：

```text
aliyun    enabled=true   is_primary=true
cxzweb    enabled=false  is_primary=false
```

4. 打开 `fund_pool`，确认有一条初始记录，余额为 `0`。

## 4. 步骤 2：配置本地 `.env.local`

### 4.1 复制环境变量模板

在项目目录打开 PowerShell：

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
Copy-Item .env.example .env.local
```

如果使用 Git Bash 或 macOS/Linux：

```bash
cp .env.example .env.local
```

### 4.2 填入 Supabase 环境变量

打开 `.env.local`，填入：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 4.3 填入阿里云百炼 API Key

```env
ALIYUN_BAILIEN_API_KEY=你的阿里云百炼Key
ALIYUN_ENABLED=true
DEFAULT_UPSTREAM=aliyun
ALIYUN_LOW_BALANCE_THRESHOLD_TOKENS=100000
```

### 4.4 填入 cxzweb API Key

因为当前 cxzweb 还没有额度，先保持关闭：

```env
CXZWEB_API_KEY=你的cxzwebKey
CXZWEB_BASE_URL=https://api.euzhi.com/v1
CXZWEB_ENABLED=false
```

等 cxzweb 额度到账后再改成：

```env
CXZWEB_ENABLED=true
```

### 4.5 填入 Admin 和 Cron 密钥

自己生成两个长随机字符串：

```env
ADMIN_BEARER_TOKEN=换成一串很长的随机字符串
CRON_SECRET=换成另一串很长的随机字符串
```

示例生成方式：

```powershell
node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

### 4.6 填入支付环境变量

如果暂时还没有支付账号，可以先保留 `xxx`，但正式收款前必须配置。

PayPal：

```env
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx
```

Stripe：

```env
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```

Coinbase：

```env
COINBASE_API_KEY=xxx
COINBASE_WEBHOOK_SECRET=xxx
COINBASE_API_VERSION=2021-08-05
```

### 4.7 不要提交 `.env.local`

确认 `.env.local` 不要提交到 GitHub。

项目应包含 `.gitignore`。如果没有，请创建并加入：

```gitignore
.env.local
.env
node_modules
.next
```

## 5. 步骤 3：本地测试

### 5.1 安装依赖

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
npm install
```

### 5.2 启动本地项目

```powershell
npm run dev
```

看到类似输出说明启动成功：

```text
Local: http://localhost:3000
```

### 5.3 访问首页

1. 打开浏览器。
2. 访问 [http://localhost:3000](http://localhost:3000)。
3. 确认页面正常显示。

### 5.4 测试 Dashboard

访问：

```text
http://localhost:3000/dashboard
```

检查：

- [ ] 能看到 token balance
- [ ] 能看到 available models
- [ ] `qwen3.5` 显示可用
- [ ] `gpt-5.5` 显示暂不可用
- [ ] 阿里云百炼显示正常
- [ ] cxzweb 显示无额度

### 5.5 测试 Admin 后台

访问：

```text
http://localhost:3000/admin
```

检查：

- [ ] 用户数
- [ ] 今日充值金额
- [ ] 今日 API 调用次数
- [ ] 阿里云 tokens
- [ ] 资金池余额
- [ ] 错误率
- [ ] 上游状态
- [ ] 手动切换上游命令

### 5.6 测试注册 API

设置测试邮箱和密码到 `.env.local`：

```env
TEST_BASE_URL=http://localhost:3000
TEST_EMAIL=test@example.com
TEST_PASSWORD=ChangeMe123!
```

运行：

```powershell
npm run test:signup
```

成功时应该看到 HTTP `201` 或包含用户信息的 JSON。

### 5.7 测试登录 API

运行：

```powershell
npm run test:login
```

成功后会输出 Supabase session token。

把输出里的 access token 填入 `.env.local`：

```env
TEST_USER_TOKEN=登录返回的_access_token
```

### 5.8 测试创建 API Key

运行：

```powershell
npm run test:api-key
```

成功后会输出 `secret_key`，形如：

```text
sk_live_xxx
```

把它填入 `.env.local`：

```env
TEST_API_KEY=sk_live_xxx
```

### 5.9 测试余额检查

运行：

```powershell
npm run test:balance
```

新用户余额通常为 `0`。

如果要给测试用户手动加额度，在 Supabase SQL Editor 执行：

```sql
select public.credit_tokens('测试用户UUID', 1000000);
```

### 5.10 测试阿里云上游调用

确保测试用户有余额后运行：

```powershell
npm run test:upstream
```

检查：

- [ ] 请求模型是 `qwen3.5`
- [ ] 上游调用成功
- [ ] `api_calls` 表新增记录
- [ ] `token_balances` 被扣减
- [ ] `system_logs` 有 API 调用日志

### 5.11 本地测试必须通过的项目

- [ ] 首页能访问
- [ ] Dashboard 能访问
- [ ] Admin 能访问
- [ ] `npm run test:signup` 成功
- [ ] `npm run test:login` 成功
- [ ] `npm run test:api-key` 成功
- [ ] `npm run test:balance` 成功
- [ ] `npm run test:upstream` 成功
- [ ] `npm run typecheck` 成功
- [ ] `npm run build` 成功

## 6. 步骤 4：推送到 GitHub

### 6.1 创建 GitHub 仓库

1. 打开 [https://github.com/new](https://github.com/new)。
2. `Repository name` 输入：

```text
GPT55-Token-Relay
```

3. 选择 `Private` 或 `Public`。
4. 不要勾选初始化 README。
5. 点击 `Create repository`。

### 6.2 推送代码

在项目目录执行：

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/GPT55-Token-Relay.git
git push -u origin main
```

如果本机没有安装 Git，请先安装：

[https://git-scm.com/downloads](https://git-scm.com/downloads)

### 6.3 验证上传成功

1. 打开你的 GitHub 仓库页面。
2. 确认能看到项目文件。
3. 确认没有上传 `.env.local`。

## 7. 步骤 5：部署到 Vercel

### 7.1 导入 GitHub 仓库

1. 打开 [https://vercel.com/new](https://vercel.com/new)。
2. 使用 GitHub 登录。
3. 找到 `GPT55-Token-Relay` 仓库。
4. 点击 `Import`。

### 7.2 配置构建设置

一般保持默认：

```text
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 7.3 配置 Vercel 环境变量

在 Vercel 项目导入页面或项目 `Settings -> Environment Variables` 添加：

```env
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ADMIN_BEARER_TOKEN=xxx
CRON_SECRET=xxx

ALIYUN_BAILIEN_API_KEY=xxx
ALIYUN_ENABLED=true
DEFAULT_UPSTREAM=aliyun
ALIYUN_LOW_BALANCE_THRESHOLD_TOKENS=100000

CXZWEB_API_KEY=xxx
CXZWEB_BASE_URL=https://api.euzhi.com/v1
CXZWEB_ENABLED=false

NO1API_API_KEY=xxx
NO1API_ENABLED=false
FREEMODEL_API_KEY=xxx
FREEMODEL_ENABLED=false
```

如果配置支付，再添加：

```env
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
COINBASE_API_KEY=xxx
COINBASE_WEBHOOK_SECRET=xxx
COINBASE_API_VERSION=2021-08-05
```

### 7.4 部署

1. 点击 `Deploy`。
2. 等待构建完成。
3. 复制 Vercel 域名，例如：

```text
https://gpt55-token-relay.vercel.app
```

### 7.5 验证线上页面

访问：

```text
https://你的域名.vercel.app
https://你的域名.vercel.app/dashboard
https://你的域名.vercel.app/admin
https://你的域名.vercel.app/docs
```

## 8. 步骤 6：配置 Vercel Cron Job

项目根目录已有：

```text
vercel.json
```

内容类似：

```json
{
  "crons": [
    {
      "path": "/api/cron/check-upstream",
      "schedule": "0 2 * * *"
    }
  ]
}
```

表示每天 02:00 检查上游余额。

### 8.1 在 Vercel 检查 Cron

1. 打开 Vercel Dashboard。
2. 点击 `GPT55-Token-Relay` 项目。
3. 点击 `Settings`。
4. 点击 `Cron Jobs`。
5. 确认 `/api/cron/check-upstream` 已出现。

### 8.2 手动触发 Cron

可以用命令测试：

```bash
curl https://你的域名.vercel.app/api/cron/check-upstream \
  -H "Authorization: Bearer 你的_CRON_SECRET"
```

成功返回：

```json
{
  "ok": true
}
```

## 9. 步骤 7：配置支付 Webhook

如果你还没准备好支付账号，可以先跳过这一节，但正式运营前必须配置至少一个支付渠道。

### 9.1 PayPal Webhook

Webhook URL：

```text
https://你的域名.vercel.app/api/payments/paypal/webhook
```

PayPal Dashboard 操作：

1. 登录 PayPal Developer。
2. 进入 `Apps & Credentials`。
3. 选择你的 App。
4. 找到 `Webhooks`。
5. 点击 `Add Webhook`。
6. 填入上面的 URL。
7. 选择支付完成相关事件。
8. 保存后复制 Webhook ID。
9. 填入 Vercel 环境变量：

```env
PAYPAL_WEBHOOK_ID=xxx
```

### 9.2 Stripe Webhook

Webhook URL：

```text
https://你的域名.vercel.app/api/payments/stripe/webhook
```

Stripe Dashboard 操作：

1. 登录 Stripe Dashboard。
2. 点击 `Developers`。
3. 点击 `Webhooks`。
4. 点击 `Add endpoint`。
5. 填入 Webhook URL。
6. 选择事件 `checkout.session.completed`。
7. 保存。
8. 复制 Signing secret。
9. 填入：

```env
STRIPE_WEBHOOK_SECRET=xxx
```

### 9.3 Coinbase Webhook

Webhook URL：

```text
https://你的域名.vercel.app/api/payments/coinbase/webhook
```

Coinbase Commerce 操作：

1. 登录 Coinbase Commerce。
2. 进入 `Settings`。
3. 找到 Webhook subscriptions。
4. 添加 Webhook URL。
5. 选择 charge confirmed 相关事件。
6. 复制 webhook shared secret。
7. 填入：

```env
COINBASE_WEBHOOK_SECRET=xxx
```

### 9.4 Webhook IP 白名单

如果你要启用 IP 白名单，在 Vercel 环境变量填入逗号分隔 IP：

```env
PAYPAL_WEBHOOK_IP_ALLOWLIST=1.1.1.1,2.2.2.2
STRIPE_WEBHOOK_IP_ALLOWLIST=3.3.3.3
COINBASE_WEBHOOK_IP_ALLOWLIST=4.4.4.4
```

如果留空，则只依赖 webhook 签名验证。

## 10. 步骤 8：获取 cxzweb 额度

### 10.1 注册 V2EX

1. 打开 [https://v2ex.com](https://v2ex.com)。
2. 点击 `Sign Up`。
3. 完成注册。

### 10.2 打开 cxzweb 赠送额度帖子

访问：

```text
https://v2ex.com/t/1211033
```

### 10.3 按帖子要求评论

评论内容按帖子要求填写。示例：

```text
你好，我想申请 cxzweb 体验额度。
邮箱：你的邮箱@example.com
用途：测试 GPT-5.5 API 中转服务。
```

注意：不要在公开评论里泄露 API Key、密码、支付密钥。

### 10.4 等待额度到账

通常需要 1 到 2 天，具体以对方处理速度为准。

### 10.5 额度到账后启用 cxzweb

本地 `.env.local`：

```env
CXZWEB_ENABLED=true
```

Vercel 环境变量：

```env
CXZWEB_ENABLED=true
```

Supabase SQL Editor 执行：

```sql
update public.upstream_config
set enabled = true,
    balance_usd = 17,
    status = 'normal',
    warning_message = null,
    updated_at = now()
where upstream_service = 'cxzweb';
```

### 10.6 切换主上游到 cxzweb

```bash
curl -X POST https://你的域名.vercel.app/api/admin/upstream/switch \
  -H "Authorization: Bearer 你的_ADMIN_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"upstream_service":"cxzweb","reason":"cxzweb credit received"}'
```

## 11. 步骤 9：API Key 轮换

### 11.1 用户 API Key 轮换

建议用户定期轮换自己的 API Key：

1. 创建新 API Key。
2. 把业务系统切换到新 Key。
3. 确认新 Key 可用。
4. 撤销旧 Key。

安全原则：

- [ ] 不要把 API Key 发到聊天软件
- [ ] 不要提交到 GitHub
- [ ] 不要写进前端代码
- [ ] 泄露后立即撤销

### 11.2 阿里云百炼 Key 轮换

1. 登录阿里云百炼控制台。
2. 进入 API Key 管理。
3. 创建新 Key。
4. 更新本地 `.env.local`。
5. 更新 Vercel 环境变量 `ALIYUN_BAILIEN_API_KEY`。
6. 重新部署 Vercel。
7. 测试 `qwen3.5` 调用。
8. 删除旧 Key。

### 11.3 cxzweb Key 轮换

1. 登录 cxzweb Dashboard。
2. 创建新 API Key。
3. 更新本地 `.env.local`。
4. 更新 Vercel 环境变量 `CXZWEB_API_KEY`。
5. 重新部署 Vercel。
6. 测试 `gpt-5.5` 调用。
7. 删除旧 Key。

建议每 3 个月轮换一次上游 API Key。

## 12. 步骤 10：上线后监控

### 12.1 每天检查 Admin 后台

访问：

```text
https://你的域名.vercel.app/admin
```

重点关注：

- [ ] 当前用户数
- [ ] 今日充值金额
- [ ] 今日 API 调用次数
- [ ] 阿里云百炼剩余 tokens
- [ ] cxzweb 额度
- [ ] 资金池余额
- [ ] 错误率

### 12.2 阿里云余额低于 10 万 tokens

如果阿里云百炼余额低于 `100000` tokens：

1. Admin 后台会显示 warning。
2. `system_logs` 会记录 cron 检查日志。
3. 你可以选择购买更多阿里云额度。
4. 如果 cxzweb 有额度，也可以切换到 cxzweb。

### 12.3 错误率超过 5%

排查顺序：

1. 打开 Supabase。
2. 查看 `system_logs`。
3. 筛选 `level = error`。
4. 检查上游状态。
5. 检查 Vercel Functions 日志。
6. 检查支付 webhook 日志。

### 12.4 每周检查项目

- [ ] Supabase 数据库是否正常
- [ ] Vercel 部署是否正常
- [ ] Cron 是否每天执行
- [ ] 支付 webhook 是否有失败
- [ ] 上游余额是否充足
- [ ] 是否有异常高频 API Key

## 13. 常见问题排查 FAQ

### Q1：用户注册失败

可能原因：

- Supabase URL 错误
- anon key 错误
- Supabase Auth 设置异常

解决：

1. 检查 `NEXT_PUBLIC_SUPABASE_URL`。
2. 检查 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. 查看 Vercel Function Logs。
4. 查看 Supabase Auth Logs。

### Q2：充值后余额没有增加

可能原因：

- webhook 没配置
- webhook secret 错误
- provider 没发送支付完成事件
- `payments.transaction_id` 已经处理过

解决：

1. 查看支付平台 webhook 日志。
2. 查看 Supabase `payments` 表。
3. 查看 Supabase `system_logs` 表。
4. 确认 webhook URL 是线上域名。

### Q3：API 返回 402

含义：

```text
用户余额不足
```

解决：

1. 让用户充值。
2. 或测试环境手动加 tokens：

```sql
select public.credit_tokens('用户UUID', 1000000);
```

### Q4：API 返回 429

含义：

```text
该 API Key 每分钟超过 60 次请求
```

解决：

1. 降低请求频率。
2. 做客户端重试退避。
3. 正式高流量时把限流从内存改成 Redis / Upstash。

### Q5：API 返回“上游暂不可用，请稍后再试”

通常是请求了 `gpt-5.5`，但 cxzweb 还没有额度。

解决：

1. 等 cxzweb V2EX 额度到账。
2. 设置 `CXZWEB_ENABLED=true`。
3. 更新 `upstream_config.balance_usd`。
4. 重新测试。

### Q6：Cron Job 失败

排查：

1. 打开 Vercel Dashboard。
2. 查看 Functions 日志。
3. 检查 `CRON_SECRET`。
4. 手动 curl `/api/cron/check-upstream`。
5. 查看 `system_logs`。

### Q7：Webhook 返回 403

可能是 IP 白名单拦截。

解决：

1. 检查 `PAYPAL_WEBHOOK_IP_ALLOWLIST`。
2. 检查 `STRIPE_WEBHOOK_IP_ALLOWLIST`。
3. 检查 `COINBASE_WEBHOOK_IP_ALLOWLIST`。
4. 如果不确定 provider IP，先清空白名单，只保留签名验证。

### Q8：构建失败

本地执行：

```bash
npm run typecheck
npm run build
```

如果本地成功但 Vercel 失败：

1. 检查 Node.js 版本。
2. 检查环境变量是否都添加到了 Vercel。
3. 检查是否提交了最新代码。

## 14. 运营建议

### 14.1 前 10 个用户

- [ ] 手动验证注册流程
- [ ] 手动验证充值流程
- [ ] 手动验证 API Key 创建
- [ ] 手动验证 API 调用
- [ ] 手动验证余额扣减
- [ ] 每天查看 `system_logs`

### 14.2 前 100 个用户

- [ ] 每天检查 Admin 后台
- [ ] 每天检查支付 webhook
- [ ] 每天检查上游余额
- [ ] 记录常见报错
- [ ] 优化 FAQ

### 14.3 100+ 用户

建议升级：

- Redis / Upstash 持久化限流
- 更完整的用户 Dashboard
- 自动购买上游额度
- 更严格风控
- 账单导出
- 邮件告警
- 支付退款和拒付处理

### 14.4 API Key 安全

- [ ] 每 3 个月轮换一次上游 Key
- [ ] 发现泄露立即撤销
- [ ] 不在公开页面展示 Key
- [ ] 不把 `.env.local` 上传 GitHub

### 14.5 数据备份

Supabase 会提供备份能力。正式运营后建议：

- [ ] 开启 Supabase 自动备份
- [ ] 每周导出关键表
- [ ] 重点备份 `payments`
- [ ] 重点备份 `api_calls`
- [ ] 重点备份 `token_balances`

## 15. 联系和支持入口

项目内部排查：

- `README.md`：项目说明
- `DEPLOYMENT.md`：上线操作手册
- `/docs`：用户 API 文档
- `system_logs`：系统错误日志
- `api_calls`：API 调用记录
- `payments`：支付记录
- `upstream_switch_logs`：上游切换记录

上游支持：

- 阿里云百炼支持：[https://bailian.aliyun.com/support](https://bailian.aliyun.com/support)
- cxzweb V2EX 帖子：[https://v2ex.com/t/1211033](https://v2ex.com/t/1211033)

## 16. 最终上线确认清单

- [ ] Supabase 项目创建完成
- [ ] `init-database.sql` 已成功执行
- [ ] admin 用户已创建
- [ ] `.env.local` 本地配置完成
- [ ] 阿里云百炼 Key 已配置
- [ ] cxzweb Key 已配置但暂时关闭
- [ ] 本地 `npm run typecheck` 通过
- [ ] 本地 `npm run build` 通过
- [ ] GitHub 仓库已创建
- [ ] 代码已推送 GitHub
- [ ] Vercel 项目已部署
- [ ] Vercel 环境变量已配置
- [ ] 线上首页可访问
- [ ] 线上 `/dashboard` 可访问
- [ ] 线上 `/admin` 可访问
- [ ] 线上 `/docs` 可访问
- [ ] Cron Job 已生效
- [ ] 支付 webhook 已配置，或确认暂时不启用支付
- [ ] 测试用户能创建 API Key
- [ ] 测试用户充值或手动加余额成功
- [ ] `qwen3.5` 上游调用成功
- [ ] `gpt-5.5` 在 cxzweb 无额度时返回暂不可用

完成以上清单后，即可开始小规模试运营。
