// 文件路径: app/api/submit/route.ts

import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';
import { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints';

// 1. 初始化 Notion 客户端
// 确保在你的 .env.local 文件中设置了 NOTION_API_KEY 和 NOTION_DATABASE_ID
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID!;

// 2. 为请求体定义一个清晰的类型接口
// 这将替换所有不安全的 'any' 类型
interface SubmissionPayload {
    id: string;
    services: string[];
    formData: Record<string, unknown>;
}

/**
 * 3. 创建一个类型安全的辅助函数来将表单数据转换为 Notion 页面属性
 *    - 这个函数将扁平的 formData 对象转换为 Notion API 需要的复杂结构。
 *    - 使用了 Notion 客户端提供的 'CreatePageParameters' 类型来确保输出是正确的。
 *    - 这是修复类型错误的核心。
 */
function buildNotionProperties(payload: SubmissionPayload): CreatePageParameters['properties'] {
    const { id, services, formData } = payload;

    // 初始化 Notion 页面属性，并设置一些总览信息
    const properties: CreatePageParameters['properties'] = {
        // 假设 Notion 数据库中有一个名为 "Submission ID" 的 Title 属性
        'Submission ID': {
            title: [
                {
                    text: {
                        content: id,
                    },
                },
            ],
        },
        // 假设有一个名为 "Services" 的 Multi-select 属性
        'Services': {
            multi_select: services.map(s => ({ name: s })),
        },
        // 假设有一个名为 "Submission Date" 的 Date 属性
        'Submission Date': {
            date: {
                start: new Date().toISOString(),
            },
        }
    };

    // 遍历表单数据，将其动态添加到属性对象中
    for (const [key, value] of Object.entries(formData)) {
        // 跳过空值
        if (value === null || value === undefined || value === '') continue;

        // 根据值的类型，将其格式化为 Notion 支持的格式
        // 这里仅为示例，您需要根据 Notion 数据库的实际列名和类型进行调整
        let propertyName = key; // 默认使用表单字段ID作为 Notion 的列名

        // 示例：将 'reg_partA_entityName1' 映射到 'Company Name'
        if (key === 'reg_partA_entityName1') {
            propertyName = 'Company Name';
        }

        if (typeof value === 'string') {
            properties[propertyName] = { rich_text: [{ text: { content: value } }] };
        } else if (typeof value === 'number') {
            properties[propertyName] = { number: value };
        } else if (typeof value === 'boolean') {
            properties[propertyName] = { checkbox: value };
        } else if (Array.isArray(value)) {
            // 对于数组（例如多选框），将其转换为逗号分隔的字符串
            const content = value.map(item =>
                typeof item === 'object' ? JSON.stringify(item) : String(item)
            ).join(', ');
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        } else if (typeof value === 'object' && value !== null) {
            // 对于对象（例如文件上传或动态字段），将其序列化为 JSON 字符串
            const content = JSON.stringify(value, null, 2);
            properties[propertyName] = { rich_text: [{ text: { content } }] };
        }
    }

    return properties;
}


// 4. 定义类型安全的 POST 请求处理程序
export async function POST(req: Request) {
    // 检查环境变量是否存在
    if (!databaseId || !process.env.NOTION_API_KEY) {
        console.error("Missing NOTION_API_KEY or NOTION_DATABASE_ID in environment variables.");
        return NextResponse.json(
            { error: "服务器配置错误，请联系管理员。" },
            { status: 500 }
        );
    }

    try {
        // 使用我们定义的接口来解析和验证请求体
        const body = await req.json() as SubmissionPayload;

        // 使用辅助函数来构建 Notion 页面
        const notionProperties = buildNotionProperties(body);

        // 调用 Notion API 创建页面
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: notionProperties,
        });

        // 返回成功的响应
        return NextResponse.json({ message: "Success", submissionId: body.id });

    } catch (error: unknown) { // 使用 'unknown' 来安全地捕获错误
        console.error("Notion API Error:", error);

        // 检查错误的类型并提供更详细的错误信息
        const errorMessage = error instanceof Error ? error.message : "发生未知错误";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}