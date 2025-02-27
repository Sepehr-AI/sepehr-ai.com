import { streamText, Message } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const AttachmentSchema = z.object({
  url: z.string(),
  name: z.string().optional(),
  contentType: z.string().optional(),
});
const MessageSchema = z.object({
  content: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(
    z.union([
      z.object({ type: z.literal("text"), text: z.string() }),
      z.object({ type: z.literal("code"), code: z.string() }),
      z.object({
        type: z.literal("image"),
        url: z.string(),
        alt: z.string().optional(),
      }),
      z.object({
        type: z.literal("tool-invocation"),
        toolInvocation: z.any(),
      }),
      z.object({ type: z.literal("source"), source: z.any() }),
      z.object({ type: z.literal("reasoning"), reasoning: z.string() }),
    ])
  ),
  experimental_attachments: z.array(AttachmentSchema).optional(),
});

// Define the request schema
const RequestSchema = z.object({
  messages: z.array(MessageSchema),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { messages } = parsed.data;
  const result = streamText({
    model: openrouter("cognitivecomputations/dolphin3.0-r1-mistral-24b:free"),
    messages:
      messages?.length > 1
        ? messages
        : [
            {
              role: "system",
              content:
                "Use Farsi as the default language for all responses, unless the user communicates in another language.",
            },
            ...messages,
          ],
  });

  return result.toDataStreamResponse({ status: 200 });
}
