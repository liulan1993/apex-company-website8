// File Path: app/api/submit/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Define the structure of the incoming request body for type safety.
interface SubmissionPayload {
    id: string; // This will be used as the key in Redis
    services: string[];
    formData: Record<string, unknown>;
}

// Check if the necessary environment variables for Vercel KV are present.
// These are automatically set by Vercel when you connect a KV (Redis) database.
if (!process.env.KV_URL) {
    throw new Error('Missing required Vercel KV environment variables.');
}

// Create a Redis client instance.
const kv = createClient({
  url: process.env.KV_URL,
  token: process.env.KV_TOKEN,
});

export async function POST(req: Request) {
    try {
        // Parse the incoming request body.
        const body = await req.json() as SubmissionPayload;

        // Use the unique submission ID from the payload as the key in Redis.
        const submissionKey = `submission:${body.id}`;
        
        // Prepare the data to be stored. We'll store the entire payload.
        const dataToStore = {
            services: body.services,
            formData: body.formData,
            submittedAt: new Date().toISOString(),
        };

        // Store the data in Redis.
        // The `set` command will store the JSON object at the specified key.
        await kv.set(submissionKey, JSON.stringify(dataToStore));

        // Return a successful response.
        return NextResponse.json({ message: "Success", submissionId: body.id });

    } catch (error: unknown) {
        console.error("Redis submission error:", error);

        // Provide a clear error message if something goes wrong.
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: `Submission failed: ${errorMessage}` }, { status: 500 });
    }
}
