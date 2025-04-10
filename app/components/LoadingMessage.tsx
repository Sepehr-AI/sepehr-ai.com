import styles from "./loadingMessage.module.css";
import { AiOutlineLoading } from "react-icons/ai";
import CompanyLogo from "./companyLogos/CompanyLogo";

export default function LoadingMessage({
  aiCompanyWebsite,
}: {
  aiCompanyWebsite: string;
}) {
  return (
    <div className="my-1 group text-[0.920rem] mx-auto w-full text-gray-800 flex flex-row mb-4">
      <div className={"flex-1 content-center"}>
        <div className="w-8 h-8 float-left m-2 border-2 p-[0.1rem] border-gray-700 rounded-full shrink-0 grow-0">
          <div className="flex justify-center items-center w-full h-full">
            <CompanyLogo
              className="!w-auto !h-full"
              companyWebsite={aiCompanyWebsite}
            />
          </div>
        </div>
      </div>
      <div className="min-h-[10vh] flex-none flex flex-col justify-center xl:w-2xl lg:w-xl w-[85%] gap-1">
        {/* Action Block: Copy and Toggle */}
        {/* <p className="p-1">در حال بارگزاری</p> */}
        <div className={styles.loadingIcon + " flex justify-center"}>
          <AiOutlineLoading />
        </div>
      </div>
      <div className="flex-1"></div>
    </div>
  );
}
