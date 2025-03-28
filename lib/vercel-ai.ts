"use client";

import { Attachment, JSONValue, Message, ToolInvocation, UIMessage } from "ai";

export type FileUIPart = {
  type: "file";
  mimeType: string;
  data: string;
};

export type LanguageModelV1ProviderMetadata = Record<
  string,
  Record<string, JSONValue>
>;

export type LanguageModelV1Source = {
  /**
   * A URL source. This is return by web search RAG models.
   */
  sourceType: "url";
  /**
   * The ID of the source.
   */
  id: string;
  /**
   * The URL of the source.
   */
  url: string;
  /**
   * The title of the source.
   */
  title?: string;
  /**
   * Additional provider metadata for the source.
   */
  providerMetadata?: LanguageModelV1ProviderMetadata;
};

/**
Reason why a language model finished generating a response.

Can be one of the following:
- `stop`: model generated stop sequence
- `length`: model generated maximum number of tokens
- `content-filter`: content filter violation stopped the model
- `tool-calls`: model triggered tool calls
- `error`: model stopped because of an error
- `other`: model stopped for other reasons
- `unknown`: the model has not transmitted a finish reason
 */
export type LanguageModelV1FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "other"
  | "unknown";

/**
 * A text part of a message.
 */
export type TextUIPart = {
  type: "text";
  /**
   * The text content.
   */
  text: string;
};
/**
 * A reasoning part of a message.
 */
export type ReasoningUIPart = {
  type: "reasoning";
  /**
   * The reasoning text.
   */
  reasoning: string;
};
/**
 * A tool invocation part of a message.
 */
export type ToolInvocationUIPart = {
  type: "tool-invocation";
  /**
   * The tool invocation.
   */
  toolInvocation: ToolInvocation;
};
/**
 * A source part of a message.
 */
export type SourceUIPart = {
  type: "source";
  /**
   * The source.
   */
  source: LanguageModelV1Source;
};
/**
 * A step boundary part of a message.
 */
export type StepStartUIPart = {
  type: "step-start";
};

export type AiMessageType =
  | TextUIPart
  | ReasoningUIPart
  | ToolInvocationUIPart
  | SourceUIPart
  | FileUIPart
  | StepStartUIPart;

/**
 * AI SDK UI Messages. They are used in the client and to communicate between the frontend and the API routes.
 */
export interface AiMessage {
  /**
  A unique identifier for the message.
     */
  id: string;
  /**
  The timestamp of the message.
     */
  createdAt?: Date;
  /**
   * Additional attachments to be sent along with the message.
   */
  experimental_attachments?: Attachment[];
  /**
  The 'data' role is deprecated.
     */
  role: "system" | "user" | "assistant" /* | "data" */;
  /**
   * Additional message-specific information added on the server via StreamData
   */
  annotations?: JSONValue[] | undefined;
  /**
   * The parts of the message. Use this for rendering the message in the UI.
   *
   * Assistant messages can have text, reasoning and tool invocation parts.
   * User messages can have text parts.
   */
  parts: Array<AiMessageType>;
}

export function sdkMessageToAiMessage(
  msg: Message | UIMessage,
  partsFilter?: (p: AiMessageType) => boolean
): AiMessage {
  if (!msg.parts) {
    console.error("Invalid message.", msg);
    throw new Error(
      "Invalid message passed to sdkMessageToAiMessage. Check the console for more information."
    );
  }

  return {
    id: msg.id,
    role: msg.role,
    createdAt: msg.createdAt,
    annotations: msg.annotations,
    experimental_attachments: msg.experimental_attachments,
    parts: (!partsFilter ? msg.parts : msg.parts.filter(partsFilter)).filter(
      (v) => v.type !== "reasoning" || v.reasoning.trim().length
    ),
  } as AiMessage;
}

export function mapMessagePartsToContent(msg: Message[]): Message[] {
  return msg.map((m) => {
    if (m.content?.length) return m;

    return {
      ...m,
      content:
        m.parts
          ?.filter((m) => m.type === "text")
          ?.map((m) => m.text)
          ?.join(";") || "",
    } as Message;
  });
}

export function aiMessageToSdkMessage<
  Type extends Message | UIMessage = Message
>(msg: AiMessage): Type {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.createdAt,
    annotations: msg.annotations,
    experimental_attachments: msg.experimental_attachments,
    content: msg.parts
      .filter((m) => m.type === "text")
      .map((m) => m.text)
      .join(";"),
  } as Type;
}
