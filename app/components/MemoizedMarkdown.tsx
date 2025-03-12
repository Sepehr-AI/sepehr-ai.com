/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { marked } from "marked";
import { memo, ReactElement, ReactNode, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaRegCopy } from "react-icons/fa6";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.reduce((acc: string[], token: any) => {
    if (token.raw && token.raw.trim().length > 0) {
      acc.push(token.raw);
    }
    return acc;
  }, []);
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
    return (
      <div
        className={
          "w-full markdown markdown-body" + (className ? ` ${className}` : "")
        }
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
          rehypePlugins={[[rehypeKatex], rehypeRaw]}
          components={{
            code: (props) => {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              const codeText = String(children).replace(/\n$/, "");
              const handleCopy = async (
                e: React.MouseEvent<HTMLButtonElement>
              ) => {
                e.preventDefault();
                try {
                  copy(codeText);
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
                  <div className="flex pt-[1em] px-[1em]">
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
                  <SyntaxHighlighter
                    {...(rest as any)}
                    style={oneLight}
                    language={match[1]}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code {...rest} dir="auto">
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
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
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
