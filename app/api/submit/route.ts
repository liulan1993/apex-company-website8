import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 辅助函数：将表单数据转换为Markdown格式
function formatDataToMarkdown(data: any): string {
    let md = '';

    md += `# 客户资料提交\n\n`;
    md += `**提交ID:** \`${data.id}\`\n\n`;
    md += `**提交时间:** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
    md += `## 所选服务\n\n- ${data.services.join('\n- ')}\n\n`;
    
    md += `## 详细信息\n\n`;

    for (const key in data.formData) {
        const value = data.formData[key];
        
        let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        md += `### ${label}\n\n`;

        if (Array.isArray(value)) {
            if (value.every(item => typeof item === 'object' && item !== null)) {
                value.forEach((item, index) => {
                    md += `#### ${label} ${index + 1}\n\n`;
                    for (const itemKey in item) {
                        md += `- **${itemKey}:** ${item[itemKey]}\n`;
                    }
                    md += '\n';
                });
            } else {
                md += value.map(item => `- ${item}`).join('\n') + '\n\n';
            }
        } else if (typeof value === 'object' && value !== null) {
             if (value.file) {
                md += `- **文件名:** ${value.file.name}\n- **文件大小:** ${value.file.size} bytes\n\n`;
             }
        } else {
            md += `${value}\n\n`;
        }
    }

    return md;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const markdownContent = formatDataToMarkdown(body);
    
    const submissionId = body.id;
    if (!submissionId) {
        throw new Error('Submission ID is missing.');
    }
    
    await kv.set(submissionId, markdownContent);

    return NextResponse.json({ success: true, id: submissionId });
  } catch (error) {
    console.error('API Error:', error);
    // @ts-ignore
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
