/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { marked } from "marked";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import remarkBreaks from "remark-breaks";
import ReactMarkdown from "react-markdown";
import { FaRegCopy } from "react-icons/fa6";
import rehypeMathml from "@daiji256/rehype-mathml";
import { memo, type MouseEvent, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "./ThemeProvider";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((t) => t.raw);
  // return tokens.reduce((acc: string[], token: any) => {
  //   if (token.raw && token.raw.trim().length > 0) {
  //     acc.push(token.raw);
  //   }
  //   return acc;
  // }, []);
}

function getTextDirection(text: string): "rtl" | "ltr" {
  // Count the number of characters in the Farsi/Arabic Unicode range
  const farsiChars = text.match(/[\u0600-\u06FF]/g) || [];
  // Decide the direction based on the count. You can adjust the threshold as needed.
  return farsiChars.length > text.length * 0.1 ? "rtl" : "ltr";
}

export function processKatexInMarkdown(markdown: string) {
  const markdownWithKatexSyntax = markdown
    .replace(/\\\\\[/g, "$$$$") // Replace '\\[' with '$$'
    .replace(/\\\\\]/g, "$$$$") // Replace '\\]' with '$$'
    .replace(/\\\\\(/g, "$$$$") // Replace '\\(' with '$$'
    .replace(/\\\\\)/g, "$$$$") // Replace '\\)' with '$$'
    .replace(/\\\[/g, "$$$$") // Replace '\[' with '$$'
    .replace(/\\\]/g, "$$$$") // Replace '\]' with '$$'
    .replace(/\\\(/g, "$$$$") // Replace '\(' with '$$'
    .replace(/\\\)/g, "$$$$"); // Replace '\)' with '$$';
  return markdownWithKatexSyntax;
}

const MemoizedMarkdownBlock = memo(
  ({
    id,
    content,
    className,
  }: {
    id: string;
    content: string;
    className?: string;
  }) => {
    const theme = useTheme();
    const syntaxTheme = theme.theme === "dark" ? oneDark : oneLight;
    // const containsMath = RegExp(`(?:\d+(\.\d+)?|\([^\)]*\)|[+\-*/^])`);

    return (
      <div
        className={
          "overflow-x-auto overflow-y-hidden markdown-body space-y-4" +
          (className ? ` ${className}` : "")
        }
        dir={getTextDirection(content)}
        style={{ direction: getTextDirection(content) }}
      >
        <ReactMarkdown
          remarkPlugins={[
            [remarkMath, { singleDollarTextMath: false }],
            remarkGfm,
            remarkBreaks,
          ]}
          rehypePlugins={[rehypeMathml, rehypeRaw]}
          components={{
            h1: ({ node, children, ...props }) => (
              <h1
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h3>
            ),
            h4: ({ node, children, ...props }) => (
              <h4
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h4>
            ),
            h5: ({ node, children, ...props }) => (
              <h5
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h5>
            ),
            h6: ({ node, children, ...props }) => (
              <h6
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </h6>
            ),
            ul: ({ node, children, ...props }) => (
              <ul className="space-y-2" {...props}>
                {children}
              </ul>
            ),
            ol: ({ node, children, ...props }) => (
              <ol className="space-y-2" {...props}>
                {children}
              </ol>
            ),
            li: ({ node, children, ...props }) => (
              <li
                className="text-start"
                style={{
                  direction: getTextDirection(content),
                  unicodeBidi: "normal",
                }}
                {...props}
              >
                {children}
              </li>
            ),
            strong: ({ node, children, ...props }) => (
              <span className="font-bold" {...props}>
                {children}
              </span>
            ),
            code: (props) => {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              const codeText = String(children).replace(/\n$/, "");
              const handleCopy = async (e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                try {
                  copy(codeText.trim());
                  toast.success("کد در کلیپ‌بورد کپی شد.", {
                    position: "top-center",
                    toastId: `clipboard-code-${id}`,
                  });
                } catch (err) {
                  console.error("Failed to copy text: ", err);
                }
              };

              return match ? (
                <div className="my-4 ltr rounded p-1 border-1 border-gray-875">
                  <div className="flex px-[1em] py-[0.75em]">
                    <p className="flex-none text-sm">{match[1]}</p>
                    <div className="flex-auto"></div>
                    <button
                      className="flex-none flex items-center gap-1 text-sm font-vazir-force"
                      onClick={handleCopy}
                    >
                      <FaRegCopy />
                      کپی
                    </button>
                  </div>
                  <div className="syntax-highliter-container">
                    <SyntaxHighlighter
                      {...(rest as any)}
                      style={syntaxTheme}
                      language={match[1]}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <div className="syntax-highliter-container">
                  <code {...rest} dir="auto">
                    {children}
                  </code>
                </div>
              );
            },
          }}
        >
          {processKatexInMarkdown(content)}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({
    id,
    content,
    className,
  }: {
    id: string;
    content: string;
    className?: string;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        id={id}
        content={block}
        className={className}
        key={`${id}-block_${index}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
