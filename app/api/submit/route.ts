// 文件路径: app/api/submit/route.ts

import { Client, isNotionClientError } from '@notionhq/client';
import { NextResponse } from 'next/server';
import { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints';

// 1. 初始化 Notion 客户端
// 确保在你的 .env.local 文件中设置了 NOTION_API_KEY 和 NOTION_DATABASE_ID
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID!;

// 2. 为请求体定义一个清晰的类型接口
interface SubmissionPayload {
    id: string;
    services: string[];
    formData: Record<string, unknown>;
}

/**
 * 3. 创建一个类型安全的辅助函数来将表单数据转换为 Notion 页面属性 (无改动)
 */
function buildNotionProperties(payload: SubmissionPayload): CreatePageParameters['properties'] {
    const { id, services, formData } = payload;

    const properties: CreatePageParameters['properties'] = {
        'Submission ID': {
            title: [ { text: { content: id } } ],
        },
        'Services': {
            multi_select: services.map(s => ({ name: s })),
        },
        'Submission Date': {
            date: {
                start: new Date().toISOString(),
            },
        }
    };

    for (const [key, value] of Object.entries(formData)) {
        if (value === null || value === undefined || value === '') continue;

        let propertyName = key;
        if (key === 'reg_partA_entityName1') {
            propertyName = 'Company Name';
        }
        
        // 文件上传后，URL会作为字符串处理，这里的逻辑可以正确处理
        if (typeof value === 'string') {
            properties[propertyName] = { rich_text: [{ text: { content: value } }] };
        } else if (typeof value === 'number') {
            properties[propertyName] = { number: value };
        } else if (typeof value === 'boolean') {
            properties[propertyName] = { checkbox: value };
        } else if (Array.isArray(value)) {
            const content = value.map(item =>
                typeof item === 'object' ? JSON.stringify(item) : String(item)
            ).join(', ');
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        } else if (typeof value === 'object' && value !== null) {
            const content = JSON.stringify(value, null, 2);
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        }
    }

    return properties;
}


// 4. 定义类型安全的 POST 请求处理程序 (已更新错误处理逻辑)
export async function POST(req: Request) {
    if (!databaseId || !process.env.NOTION_API_KEY) {
        console.error("缺少 NOTION_API_KEY 或 NOTION_DATABASE_ID 环境变量。");
        return NextResponse.json(
            { error: "服务器配置错误，请联系管理员。" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json() as SubmissionPayload;
        const notionProperties = buildNotionProperties(body);

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: notionProperties,
        });

        return NextResponse.json({ message: "Success", submissionId: body.id });

    } catch (error: unknown) {
        console.error("API 提交错误:", error);

        // 新增: 对 Notion API 的特定错误进行处理
        if (isNotionClientError(error)) {
            const notionError = JSON.parse(error.body);
            return NextResponse.json(
                { 
                    error: `Notion API 错误: ${notionError.message}`,
                    details: notionError
                },
                { status: error.status }
            );
        }
        
        const errorMessage = error instanceof Error ? error.message : "发生未知错误";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}
