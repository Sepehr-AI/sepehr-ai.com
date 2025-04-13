import type { IconType } from "react-icons";
import { FaMicrosoft } from "react-icons/fa6";
import { FaMeta, FaXTwitter } from "react-icons/fa6";
import { SiAmazon, SiNvidia, SiOpenai } from "react-icons/si";
import { RiAnthropicFill, RiGeminiFill } from "react-icons/ri";

import Qwen from "@/components/companyLogos/Qwen";
import Mistral from "@/components/companyLogos/Mistral";
import DeepSeek from "@/components/companyLogos/Deepseek";
import WithColor from "@/components/companyLogos/WithColor";
import { companyToWebsiteMap } from "./aiCompaniesForBackend";

type CompanyWebsite =
  (typeof companyToWebsiteMap)[keyof typeof companyToWebsiteMap];

export const companyWebsiteToRiMap: Partial<
  Record<CompanyWebsite, IconType | null>
> = {
  "qwen.ai": Qwen,
  "mistral.ai": Mistral,
  "openai.com": SiOpenai,
  "deepseek.com": DeepSeek,
  "x.ai": WithColor(FaXTwitter, "#231f1e"),
  "llama.com": WithColor(FaMeta, "#0080fb"),
  "amazon.com": WithColor(SiAmazon, "#231f1e"),
  "nvidia.com": WithColor(SiNvidia, "#76b900"),
  "microsoft.com": WithColor(FaMicrosoft, "#0178d4"),
  "anthropic.com": WithColor(RiAnthropicFill, "#221f1a"),
  "gemini.google.com": WithColor(RiGeminiFill, "#8779cc"),
};
