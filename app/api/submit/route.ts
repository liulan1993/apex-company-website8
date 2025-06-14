import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

interface SubmissionBody {
    id: string;
    services: string[];
    formData: { [key: string]: any };
}

// 辅助函数：将表单数据转换为Markdown格式
function formatDataToMarkdown(data: SubmissionBody): string {
    let md = '';

    md += `# 客户资料提交\n\n`;
    md += `**提交ID:** \`${data.id}\`\n\n`;
    md += `**提交时间:** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
    
    if(data.services && data.services.length > 0) {
        md += `## 所选服务\n\n- ${data.services.join('\n- ')}\n\n`;
    }
    
    md += `## 详细信息\n\n`;

    // 辅助函数，将驼峰或下划线命名转为正常标题
    const formatLabel = (key: string) => {
        const withSpaces = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1');
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    };

    for (const key in data.formData) {
        const value = data.formData[key];
        
        const label = formatLabel(key);
        
        md += `### ${label}\n\n`;

        if (Array.isArray(value)) {
            if (value.length > 0) {
                 if (value.every(item => typeof item === 'object' && item !== null)) {
                    value.forEach((item: { [key: string]: any }, index: number) => {
                        md += `#### ${label.replace(/s$/, '')} ${index + 1}\n\n`;
                        for (const itemKey in item) {
                            md += `- **${formatLabel(itemKey)}:** ${item[itemKey] || '(未提供)'}\n`;
                        }
                        md += '\n';
                    });
                } else {
                    md += value.map(item => `- ${item}`).join('\n') + '\n\n';
                }
            } else {
                 md += `(未提供)\n\n`;
            }
        } else if (typeof value === 'object' && value !== null) {
             if (value.file) {
                md += `- **文件名:** ${value.file.name}\n- **文件大小:** ${value.file.size} bytes\n\n`;
             } else {
                md += `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
             }
        } else {
            md += `${value || '(未提供)'}\n\n`;
        }
    }

    return md;
}

export async function POST(request: Request) {
  try {
    const body: SubmissionBody = await request.json();
    
    const markdownContent = formatDataToMarkdown(body);
    
    const submissionId = body.id;
    if (!submissionId) {
        throw new Error('Submission ID is missing.');
    }
    
    await kv.set(submissionId, markdownContent);

    return NextResponse.json({ success: true, id: submissionId });
  } catch (error) {
    // @ts-expect-error
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
