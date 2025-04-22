"use client";

import Loading from "@/components/Loading";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    router.replace(`/dashboard/payment-result?${params.toString()}`);
  }, [params, router]);

  return <Loading />;
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentCallback />
    </Suspense>
  );
}
