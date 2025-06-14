// 文件路径: app/api/submit/route.ts

import { Client, isNotionClientError, isAPIResponseError } from '@notionhq/client';
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
 * 3. 创建一个类型安全的辅助函数来将表单数据转换为 Notion 页面属性
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
        // 示例：将特定的表单字段ID映射到更友好的Notion列名
        if (key === 'reg_partA_entityName1') {
            propertyName = 'Company Name';
        }
        
        // 根据值的类型，格式化为Notion API接受的格式
        if (typeof value === 'string') {
             // 对于文件，这里会收到一个URL字符串，可以直接存入rich_text
            properties[propertyName] = { rich_text: [{ text: { content: value } }] };
        } else if (typeof value === 'number') {
            properties[propertyName] = { number: value };
        } else if (typeof value === 'boolean') {
            properties[propertyName] = { checkbox: value };
        } else if (Array.isArray(value)) {
            // 将数组（如多选框的值）转换为逗号分隔的字符串
            const content = value.map(item =>
                typeof item === 'object' ? JSON.stringify(item) : String(item)
            ).join(', ');
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        } else if (typeof value === 'object' && value !== null) {
            // 将对象（如动态字段组）序列化为JSON字符串
            const content = JSON.stringify(value, null, 2);
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        }
    }

    return properties;
}


// 4. 定义类型安全的 POST 请求处理程序
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

        // ====================================================================
        // 核心修复: 修正 Notion API 的错误处理逻辑
        // ====================================================================
        if (isNotionClientError(error)) {
            // 检查错误是否为 APIResponseError 来安全地访问 status 属性
            const status = isAPIResponseError(error) ? error.status : 500;
            
            return NextResponse.json(
                {
                    error: `Notion API 错误: ${error.message}`,
                    code: error.code // 返回具体的 Notion 错误码以便调试
                },
                { status }
            );
        }
        
        // 处理其他类型的未知错误
        const errorMessage = error instanceof Error ? error.message : "发生未知错误";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}
