export const NEXT_PUBLIC_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const showCaseUriToUrl = (filename: string, subfolder?: string) =>
  `${NEXT_PUBLIC_BASE_URL}/model-showcase/${!subfolder ? '' : (subfolder + '/')}${filename}`;
