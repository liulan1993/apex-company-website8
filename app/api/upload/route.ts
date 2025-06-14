import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// 使用一个自定义的字符集来生成随机ID，避免文件名以特殊字符开头
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10 // ID 长度
);

export const runtime = 'edge'; // 使用 Edge Runtime 以获得更好的性能

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // 确保文件名存在
  if (!filename) {
    return NextResponse.json(
      { error: '必须提供文件名。' },
      { status: 400 },
    );
  }
  
  // 确保请求体(文件)存在
  if (!request.body) {
      return NextResponse.json({ message: '没有要上传的文件。' }, { status: 400 });
  }

  // 为文件名添加一个随机前缀，以防止重名覆盖
  const randomPrefix = nanoid();
  const uniqueFilename = `${randomPrefix}-${filename}`;

  // put 函数会将文件流式传输到 Vercel Blob，并返回包含 URL 的 blob 对象
  const blob = await put(uniqueFilename, request.body, {
    access: 'public', // 设置为公开访问
  });

  // 将包含 URL 的 blob 对象返回给前端
  return NextResponse.json(blob);
}
