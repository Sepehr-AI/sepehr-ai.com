export const NEXT_PUBLIC_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const showCaseUriToUrl = (filename: string, subfolder?: string) =>
  `${NEXT_PUBLIC_BASE_URL}/model-showcase/${!subfolder ? "" : subfolder + "/"}${filename}`;

export const modelCodeToShowCaseUrl = (code: string, subfolder: string) => {
  // cards & images -> jpg
  // videos/posters -> png
  // videos -> mp4
  const format =
    subfolder === "cards" || subfolder === "images"
      ? "jpg"
      : subfolder === "videos/posters"
        ? "png"
        : "mp4";
  const name = code.split("/")[1] as string;

  return showCaseUriToUrl(`${name}.${format}`, subfolder);
};
