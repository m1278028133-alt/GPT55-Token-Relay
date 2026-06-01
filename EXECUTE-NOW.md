# EXECUTE NOW

项目位置：`C:\Users\pro3\Desktop\GPT55-Token-Relay`

## 步骤 1：Supabase 初始化（10 分钟）

预期结果：Supabase 项目创建完成，数据库表全部创建成功。

- [ ] 注册/登录：[https://supabase.com](https://supabase.com)
- [ ] 创建新项目：`New Project`
- [ ] 获取 3 个环境变量：
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 创建 admin 用户：`Authentication -> Users -> Add user`
- [ ] 记录 admin 用户 UUID
- [ ] 打开 `init-database.sql`
- [ ] 修改文件底部 admin 插入语句里的 UUID 和邮箱
- [ ] 打开 Supabase：`SQL Editor -> New query`
- [ ] 粘贴 `init-database.sql` 全部内容
- [ ] 点击 `Run`
- [ ] 验证表创建成功：`Table Editor`

必须看到这些表：

- [ ] `users`
- [ ] `api_keys`
- [ ] `token_balances`
- [ ] `api_calls`
- [ ] `payments`
- [ ] `upstream_balance`
- [ ] `fund_pool`
- [ ] `upstream_switch_logs`
- [ ] `upstream_config`
- [ ] `system_logs`

## 步骤 2：配置 `.env.local`（5 分钟）

预期结果：本地环境变量配置完成。

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
Copy-Item .env.example .env.local
```

填入 7 个必填变量：

- [ ] `NEXT_PUBLIC_SUPABASE_URL=xxx`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=xxx`
- [ ] `CXZWEB_API_KEY=已获取的cxzwebKey`
- [ ] `CXZWEB_ENABLED=false`
- [ ] `ALIYUN_BAILIEN_API_KEY=已获取的阿里云百炼Key`
- [ ] `ALIYUN_ENABLED=true`

建议同时填入：

- [ ] `ADMIN_BEARER_TOKEN=一串长随机字符串`
- [ ] `CRON_SECRET=一串长随机字符串`
- [ ] `DEFAULT_UPSTREAM=aliyun`
- [ ] `ALIYUN_LOW_BALANCE_THRESHOLD_TOKENS=100000`

## 步骤 3：本地测试（10 分钟）

预期结果：本地页面能打开，Dashboard 和 Admin 状态正确。

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
npm run dev
```

- [ ] 访问：[http://localhost:3000](http://localhost:3000)
- [ ] 注册测试账号
- [ ] 登录测试账号
- [ ] 访问：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- [ ] 确认余额显示 `0`
- [ ] 确认 `qwen3.5` 可用
- [ ] 确认 `gpt-5.5` 暂不可用
- [ ] 创建 API Key
- [ ] 访问：[http://localhost:3000/admin](http://localhost:3000/admin)
- [ ] 用 admin 账号检查监控面板

## 步骤 4：运行测试脚本（5 分钟）

预期结果：所有脚本成功，输出包含成功状态。

先确认 `.env.local` 已填：

- [ ] `TEST_EMAIL`
- [ ] `TEST_PASSWORD`
- [ ] `TEST_USER_TOKEN`
- [ ] `TEST_API_KEY`

执行：

```powershell
node scripts/test-signup.js
node scripts/test-login.js
node scripts/test-api-key.js
node scripts/test-balance.js
node scripts/test-upstream.js
```

检查：

- [ ] `test-signup.js` 成功
- [ ] `test-login.js` 成功
- [ ] `test-api-key.js` 成功
- [ ] `test-balance.js` 成功
- [ ] `test-upstream.js` 成功
- [ ] 所有输出必须包含或等价于 `✓ PASS`

## 步骤 5：推送到 GitHub（5 分钟）

预期结果：GitHub 仓库创建完成，代码已推送。

- [ ] 创建仓库：[https://github.com/new](https://github.com/new)
- [ ] 仓库名：`GPT55-Token-Relay`

执行：

```powershell
cd C:\Users\pro3\Desktop\GPT55-Token-Relay
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/GPT55-Token-Relay.git
git push -u origin main
```

检查：

- [ ] GitHub 仓库能打开
- [ ] 文件上传成功
- [ ] `.env.local` 没有被上传

## 步骤 6：部署到 Vercel（5 分钟）

预期结果：Vercel 部署成功，获得线上域名。

- [ ] 打开：[https://vercel.com/new](https://vercel.com/new)
- [ ] 导入 GitHub 仓库：`GPT55-Token-Relay`
- [ ] 配置环境变量：复制 `.env.local` 的所有变量
- [ ] 点击 `Deploy`
- [ ] 复制域名：`xxx.vercel.app`

验证：

- [ ] `https://xxx.vercel.app` 可访问
- [ ] `https://xxx.vercel.app/dashboard` 可访问
- [ ] `https://xxx.vercel.app/admin` 可访问
- [ ] `https://xxx.vercel.app/docs` 可访问

## 步骤 7：配置 Webhook（可选，10 分钟）

预期结果：支付成功后能自动到账。

PayPal：

- [ ] 配置 Webhook URL：

```text
https://xxx.vercel.app/api/payments/paypal/webhook
```

Stripe：

- [ ] 配置 Webhook URL：

```text
https://xxx.vercel.app/api/payments/stripe/webhook
```

Coinbase：

- [ ] 配置 Webhook URL：

```text
https://xxx.vercel.app/api/payments/coinbase/webhook
```

检查：

- [ ] Webhook secret 已填入 Vercel 环境变量
- [ ] 支付平台测试事件发送成功
- [ ] `payments` 表有记录
- [ ] `system_logs` 表有支付日志

## 步骤 8：获取 cxzweb 额度（1-2 天）

预期结果：cxzweb 有额度后可启用 `gpt-5.5`。

- [ ] 注册 V2EX：[https://v2ex.com](https://v2ex.com)
- [ ] 访问：[https://v2ex.com/t/1211033](https://v2ex.com/t/1211033)
- [ ] 评论申请额度
- [ ] 等待回复
- [ ] 确认 cxzweb 额度到账
- [ ] 更新本地 `.env.local`：

```env
CXZWEB_ENABLED=true
```

- [ ] 更新 Vercel 环境变量：

```env
CXZWEB_ENABLED=true
```

- [ ] 在 Supabase SQL Editor 执行：

```sql
update public.upstream_config
set enabled = true,
    balance_usd = 17,
    status = 'normal',
    warning_message = null,
    updated_at = now()
where upstream_service = 'cxzweb';
```

- [ ] 在 Admin API 切换上游：

```bash
curl -X POST https://xxx.vercel.app/api/admin/upstream/switch \
  -H "Authorization: Bearer 你的_ADMIN_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"upstream_service":"cxzweb","reason":"cxzweb credit received"}'
```

## 紧急检查清单

上线前必须确认：

- [ ] Supabase 表创建成功
- [ ] `.env.local` 配置正确
- [ ] 本地测试通过
- [ ] 所有测试脚本 PASS
- [ ] GitHub 推送成功
- [ ] Vercel 部署成功
- [ ] 域名可以访问
- [ ] Admin 后台可以登录
- [ ] 上游阿里云可以调用

## 上线后第一天要做的

- [ ] 测试用户注册
- [ ] 测试充值：Sandbox 或真实小额支付
- [ ] 测试 API 调用
- [ ] 检查余额扣除
- [ ] 检查 Admin 监控面板
- [ ] 检查 `system_logs` 有无错误
- [ ] 检查 `api_calls` 是否记录调用
- [ ] 检查 `payments` 是否记录支付
- [ ] 检查 Vercel Functions 日志
- [ ] 检查 Supabase 数据库状态

## 联系和支持

- 项目位置：`C:\Users\pro3\Desktop\GPT55-Token-Relay`
- 完整部署手册：`DEPLOYMENT.md`
- 项目说明：`README.md`
- 用户文档：`src/app/docs/page.tsx`
- 系统日志表：`system_logs`
- API 调用表：`api_calls`
- 支付记录表：`payments`

