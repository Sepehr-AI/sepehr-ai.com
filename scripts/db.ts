// sort-imports-ignore
import "dotenv/config";

process.env["DATABASE_URL"] = process.env["DATABASE_URL_READONLY"];

/**
 * scripts/db.ts
 *
 * Full, ready-to-run TypeScript script that:
 *  - reads your Prisma schema (prisma/schema.prisma) and seeds the system prompt with it,
 *  - accepts a user question in the terminal,
 *  - asks the model to produce SQL,
 *  - if the model outputs SQL, the script validates & executes it via prisma.$queryRawUnsafe(),
 *  - sends the SQL execution result back to the model,
 *  - asks the model to analyze the result and streams the human-friendly answer to the terminal.
 *
 * Safety: this script performs light validation to allow only read-only SQL (SELECT / WITH / EXPLAIN / PRAGMA).
 *          Adjust the validator at your own risk.
 *
 * Prerequisites:
 *  - Node 18+
 *  - Install: pnpm add ai @ai-sdk/openai zod dotenv @prisma/client prisma
 *             pnpm add -D tsx typescript @types/node
 *  - A .env file containing OPENAI_API_KEY and DATABASE_URL (use the readonly user DATABASE_URL).
 *  - prisma/schema.prisma must exist and prisma client generated (npx prisma generate).
 *
 * Run:
 *  pnpm tsx scripts/db.ts
 */
import prisma from "@/lib/prisma";
import { createReplicate } from "@/replicate-chat-provider/dist";
import { type ModelMessage, stepCountIs, streamText } from "ai";
import fs from "fs/promises";
import readline from "node:readline/promises";

/* ---------------------------
   Helpers: BigInt-safe JSON serialization
   --------------------------- */

/**
 * JSON replacer that converts BigInt to Number when safe,
 * otherwise to string — this avoids "Do not know how to serialize a BigInt".
 */
function bigIntReplacer(_: string, value: any) {
  if (typeof value === "bigint") {
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    const minSafe = BigInt(Number.MIN_SAFE_INTEGER);
    if (value <= maxSafe && value >= minSafe) {
      // safe to convert to number
      return Number(value);
    }
    // convert large BigInt to string to preserve precision
    return value.toString();
  }
  return value;
}

/**
 * Safely stringify arbitrary objects/rows returned by Prisma.
 */
function safeStringify(obj: unknown, space = 2) {
  return JSON.stringify(obj, bigIntReplacer, space);
}

/* ---------------------------
   Lightweight SQL validator (allows a single trailing semicolon)
   --------------------------- */
function validateReadOnlySQL(sql: string) {
  const trimmed = sql.trim();

  // strip code fences/backticks if present (model often wraps SQL in ```sql ... ``` )
  const stripped = trimmed
    .replace(/^```(?:sql)?\n/i, "")
    .replace(/\n```$/, "")
    .trim();

  // Allow an optional single trailing semicolon (the model often emits this).
  // Remove trailing semicolons + surrounding whitespace before other checks.
  const withoutTrailingSemicolons = stripped.replace(/;+\s*$/s, "").trim();

  // If any semicolon remains, this indicates multiple statements or inline semicolons -> reject.
  if (withoutTrailingSemicolons.includes(";")) {
    throw new Error(
      "Multiple statements or inline semicolons are forbidden. Only a single read-only statement is allowed.",
    );
  }

  const lowered = withoutTrailingSemicolons.toLowerCase();

  // Allowed starters
  const allowedStarters = [/^select\b/, /^with\b/, /^explain\b/, /^pragma\b/];
  if (!allowedStarters.some((rx) => rx.test(lowered))) {
    throw new Error(
      "Only read-only queries are allowed (SELECT / WITH / EXPLAIN / PRAGMA).",
    );
  }

  // Block dangerous keywords anywhere
  const forbidden =
    /\b(insert|update|delete|drop|truncate|create|alter|replace|grant|revoke|merge|call|shutdown|commit|rollback)\b/;
  if (forbidden.test(lowered)) {
    throw new Error("Query contains forbidden keywords (DML/DDL).");
  }

  // Basic length guard
  if (withoutTrailingSemicolons.length > 20000) {
    throw new Error("SQL is suspiciously long.");
  }

  // Return cleaned SQL WITHOUT any trailing semicolon(s)
  return withoutTrailingSemicolons;
}

/* ---------------------------
   Extract SQL snippet from assistant text (heuristic)
   --------------------------- */
function extractSQLMaybe(text: string): string | null {
  if (!text) return null;
  // Remove surrounding fences
  const withoutFences = text
    .replace(/```(?:sql)?\n/i, "```")
    .replace(/```/g, "```");
  // Try to find a fenced block first
  const fenceMatch = text.match(/```(?:sql)?\n([\s\S]*?)\n```/i);
  if (fenceMatch && fenceMatch[1]) {
    const candidate = fenceMatch[1].trim();
    if (/^(select|with|explain|pragma)\b/i.test(candidate)) return candidate;
  }

  // Otherwise, find the first line that starts a SQL statement and capture until a blank line or end.
  const lines = text.split(/\r?\n/);
  let started = false;
  const outLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!started) {
      if (/^\s*(SELECT|WITH|EXPLAIN|PRAGMA)\b/i.test(l)) {
        started = true;
        outLines.push(l);
      }
    } else {
      // stop if we hit a line that looks like "Assistant:" or a new paragraph starting with a letter and colon
      if (/^\s*[A-Za-z0-9 ]{1,40}:\s/.test(l)) break;
      // stop if line looks like commentary beginning with "Note:" or "-" marker (simple heuristic)
      if (/^\s*(Note|Notes|Explanation|--|\/\*)\b/i.test(l)) break;
      outLines.push(l);
      // optional: break if next line is empty and the following line is not SQL-ish
      if (l.trim() === "") {
        // lookahead
        const next = lines[i + 1] ?? "";
        if (
          !/^\s*(SELECT|WITH|EXPLAIN|PRAGMA|FROM|WHERE|JOIN|LIMIT|ORDER|GROUP)\b/i.test(
            next,
          )
        ) {
          break;
        }
      }
    }
  }

  const candidate = outLines.join("\n").trim();
  if (!candidate) return null;
  if (/^(select|with|explain|pragma)\b/i.test(candidate)) return candidate;
  return null;
}

/* ---------------------------
   Terminal / conversation flow
   --------------------------- */
async function main() {
  // Read Prisma schema for system message context (help model generate valid SQL)
  let prismaSchema = "<unable to read prisma/schema.prisma>";
  try {
    prismaSchema = await fs.readFile("prisma/schema.prisma", "utf8");
  } catch (err) {
    console.warn(
      "Warning: prisma/schema.prisma could not be read. Continuing without schema in prompt.",
    );
  }

  const systemMessage: ModelMessage = {
    role: "system",
    content:
      "You are a helpful SQL assistant. The user will ask questions about the database. " +
      "You MUST produce a single read-only SQL query (SELECT / WITH / EXPLAIN / PRAGMA) when you need to query the DB. " +
      "When producing SQL: return ONLY the SQL statement (preferably inside triple backticks ```sql ... ``` or as raw SQL) and do NOT include destructive statements. " +
      "After the SQL is executed by the server, you will receive the query results and must analyze them to give a final human-friendly answer.\n\n" +
      "Prisma schema (for reference):\n\n" +
      "```prisma\n" +
      prismaSchema +
      "\n```\n\n" +
      "If you can answer from schema alone without querying, provide a concise answer and do NOT output SQL.",
  };

  const messages: ModelMessage[] = [systemMessage];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=== Prisma SQL CLI Agent ===");
  console.log("Type questions about the database. Ctrl+C to exit.\n");

  async function handleUserTurn(userInput: string) {
    messages.push({ role: "user", content: userInput });

    /* ---------------------------
       Step 1: Ask the model to produce SQL or an answer.
       We stream one step (the generation). The model will often output SQL.
       --------------------------- */
    const gen = streamText({
      model: createReplicate()("openai/gpt-5-nano"),
      messages,
      stopWhen: stepCountIs(1),
    });

    let assistantGen = "";
    process.stdout.write("\nAssistant (SQL generation): ");
    for await (const chunk of gen.textStream) {
      assistantGen += chunk;
      process.stdout.write(chunk);
    }
    process.stdout.write("\n\n");

    // Append generation to history
    messages.push({ role: "assistant", content: assistantGen });

    /* ---------------------------
       Step 2: Detect SQL in assistantGen. If there's SQL, validate and execute it.
       --------------------------- */
    const sqlCandidate = extractSQLMaybe(assistantGen);
    if (!sqlCandidate) {
      // No SQL: assume model answered already — we are done with this turn.
      return;
    }

    let sql: string;
    try {
      sql = validateReadOnlySQL(sqlCandidate);
    } catch (err: any) {
      const msg = `SQL validation failed: ${String(err?.message ?? err)}`;
      console.error(msg);
      messages.push({ role: "assistant", content: msg });
      return;
    }

    // Execute the SQL using prisma.$queryRawUnsafe
    let rows: any[] = [];
    let execError: string | null = null;
    try {
      // Note: $queryRawUnsafe returns any; cast to any[]
      rows = (await prisma.$queryRawUnsafe(sql)) as any[];
    } catch (err: any) {
      execError = String(err?.message ?? err);
    }

    // Build a compact result summary to send back to the model
    let resultSummary: string;
    if (execError) {
      resultSummary = `__SQL_EXECUTION_ERROR__: ${execError}`;
      console.error("Query execution error:", execError);
    } else {
      const total = Array.isArray(rows) ? rows.length : 0;
      const maxRowsToShow = 200;
      const sample =
        total > maxRowsToShow ? rows.slice(0, maxRowsToShow) : rows;
      // Use safeStringify to avoid BigInt serialization errors
      const sampleJson = safeStringify(sample, 2);
      resultSummary = `ROWS (${total} total, showing ${sample.length}):\n${sampleJson}`;
      console.log(
        `\n[Executed SQL — returned ${total} row(s). Sending to model for analysis.]\n`,
      );
    }

    // Append an assistant-style message containing the "tool result"
    messages.push({
      role: "assistant",
      content:
        `__SQL_EXECUTION_RESULT__\nSQL: ${sql}\n\n${resultSummary}\n\n` +
        "Please analyze these results and produce a concise, user-facing answer to the original question. " +
        "Be explicit about any uncertainties. If there are zero rows, explain that no matching rows were found.",
    });

    /* ---------------------------
       Step 3: Ask the model to analyze the result and produce the final answer.
       --------------------------- */
    const analysis = streamText({
      model: createReplicate()("openai/gpt-5-nano"),
      messages,
      stopWhen: stepCountIs(1),
    });

    process.stdout.write("Assistant (analysis): ");
    let analysisText = "";
    for await (const d of analysis.textStream) {
      analysisText += d;
      process.stdout.write(d);
    }
    process.stdout.write("\n\n");

    // Save final analysis to conversation history
    messages.push({ role: "assistant", content: analysisText });
  }

  try {
    while (true) {
      const q = await rl.question("You: ");
      if (!q.trim()) continue;
      try {
        await handleUserTurn(q);
      } catch (err: any) {
        console.error("Error handling user turn:", err?.message ?? err);
      }
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});
