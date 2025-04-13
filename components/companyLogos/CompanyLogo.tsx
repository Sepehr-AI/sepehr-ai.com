import { RiRobot2Fill } from "react-icons/ri";
import type { IconBaseProps } from "react-icons";
import { companyWebsiteToRiMap } from "@/lib/aiCompaniesForFrontend";

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
