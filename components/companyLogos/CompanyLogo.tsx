import { companyWebsiteToRiMap } from "@/lib/aiCompaniesForFrontend";
import type { IconBaseProps } from "react-icons";
import { RiRobot2Fill } from "react-icons/ri";

export default function CompanyLogo({
  companyWebsite,
  ...props
}: IconBaseProps & { companyWebsite: string }) {
  const TheCompnent =
    companyWebsiteToRiMap[
      companyWebsite as keyof typeof companyWebsiteToRiMap
    ] || RiRobot2Fill;

  return <TheCompnent {...props} />;
}
