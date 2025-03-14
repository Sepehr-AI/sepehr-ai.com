import { SiOpenai } from "react-icons/si";
import styles from "./loadingMessage.module.css";
import { AiOutlineLoading } from "react-icons/ai";

export default function LoadingMessage() {
  return (
    <div className="my-1 group text-[0.920rem] mx-auto w-full text-gray-800 flex flex-row mb-4">
      <div className={"flex-1 content-center"}>
        <div className="w-8 h-8 p-1.5 float-left m-2 bg-gray-700 rounded-full shrink-0 grow-0">
          <SiOpenai className="text-white w-full h-full" />
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
