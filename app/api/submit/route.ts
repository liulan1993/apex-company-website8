// File Path: app/api/submit/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 定义传入请求体的结构以确保类型安全
interface SubmissionPayload {
    id: string; // 将用作 Redis 中的键
    services: string[];
    formData: Record<string, unknown>;
}

// 检查 Vercel KV 所需的 REST API 环境变量是否存在
// 当您连接 KV (Redis) 数据库时，Vercel 会自动设置这些变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}

// 使用正确的 REST API URL 和令牌创建 Redis 客户端实例
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        // 解析传入的请求体
        const body = await req.json() as SubmissionPayload;

        // 使用载荷中的唯一提交ID作为 Redis 中的键
        const submissionKey = `submission:${body.id}`;
        
        // 准备要存储的数据。我们将存储整个载荷
        const dataToStore = {
            services: body.services,
            formData: body.formData,
            submittedAt: new Date().toISOString(),
        };

        // 将数据存储在 Redis 中
        // `set` 命令会将 JSON 对象存储在指定的键处
        await kv.set(submissionKey, JSON.stringify(dataToStore));

        // 返回成功的响应
        return NextResponse.json({ message: "Success", submissionId: body.id });

    } catch (error: unknown) {
        console.error("Redis 提交错误:", error);

        // 如果出现问题，提供清晰的错误消息
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}
