import CompanyLogo from "./companyLogos/CompanyLogo";

export default function LoadingMessage({
  aiCompanyWebsite,
}: {
  aiCompanyWebsite: string;
}) {
  return (
    <div className="py-6 bg-gray-50 dark:bg-gray-700/30 px-4 transition-colors duration-200">
      <div className="flex gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
            <CompanyLogo
              className="w-7 h-7"
              companyWebsite={aiCompanyWebsite}
            />
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="h-2.5 w-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="h-2.5 w-2.5 bg-emerald-500/70 dark:bg-emerald-400/70 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="h-2.5 w-2.5 bg-emerald-500/50 dark:bg-emerald-400/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
