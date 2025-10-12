import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { type Dispatch, type SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";

export const connectionFailedErrMsg =
  "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.";

export const backendToClientErr = (
  { status }: { status: number },
  router: AppRouterInstance,
): string => {
  switch (status) {
    case 416:
      return "اعتبار شما برای دریافت یک خروجی کامل از این مدل کافی نیست! اعتبار خود را افزایش دهید یا از مدل دیگری استفاده کنید.";
    case 429:
      return "تعداد درخواست همزمان غیر مجاز! لطفا کمی صبر کنید و مجددا امتحان کنید.";
    case 400:
      return "پیام یا فایل های ارسالی در این مدل پشتیبانی نمی‌شوند!";
    case 404:
      return "مدل یافت نشد! احتمالا این مدل حذف شده باشد و دیگر امکان استفاده مجدد فراهم نشود.";
    case 403:
      router.push("/logout");
      return "";
    case 413:
      return "حداکثر توکن مجاز برای این مدل! چت جدیدی ایجاد کنید یا پیام خود را کوتاه‌تر کنید یا اگر فایلی آپلود کردید حجم آن را بکاهید.";
    case 402:
      router.push("/dashboard/payment?balanceInsufficient=true");
      return "اعتبار ناکافی!";
    case 401:
      return "مشکل احراز هویت! از حساب کاربری خارج شود و دوباره وارد شوید و مجدد امتحان کنید و درصورت استمرار به پشتیبانی گزارش دهید.";
    case 415:
      return "این مدل امکان پردازش فایل ارسالی شما را ندارد!";
    case 408:
    case 503:
      return "عدم امکان ارتباط با مدل! سرویس مدل مدنظر در دسترس نیست. در صورت استمرار این مشکل چند ساعتی صبر کنید و مجددا امتحان کنید.";
    // 500, others ...
    default:
      return connectionFailedErrMsg;
  }
};

export function useErrorHandler({
  error,
  router,
  fileError,
  clearError,
  customError,
  setCustomError,
}: {
  clearError: () => void;
  error: Error | undefined;
  fileError: string | null;
  router: AppRouterInstance;
  customError: string | null;
  setCustomError: Dispatch<SetStateAction<string | null>>;
}) {
  const resetErrors = () => {
    clearError();
    setCustomError(null);
  };

  useEffect(() => {
    if (error || customError) {
      let errormsg: string = "";
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = JSON.parse(error?.message || "null") as any;
        if (parsed && parsed.status) {
          errormsg = backendToClientErr(parsed, router);
        } else {
          errormsg = customError || connectionFailedErrMsg;
        }
      } catch {
        errormsg = customError || connectionFailedErrMsg;
      }

      toast.error(errormsg, {
        position: "top-center",
        toastId: errormsg,
      });
    }

    if (fileError) {
      setCustomError(fileError);
    }
  }, [customError, error, fileError, router, setCustomError]);

  return { resetErrors };
}
