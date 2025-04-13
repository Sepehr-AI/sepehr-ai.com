"use client";

import { toast } from "react-toastify";
import { changePasswordAction } from "./actions";
import { type SyntheticEvent, useState, useTransition } from "react";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    startTransition(async () => {
      if (newPassword !== confirmPassword) {
        toast.error("رمز عبور با تکرار خود برابر نیست.", {
          position: "top-center",
        });
        return;
      } else if (newPassword === currentPassword) {
        toast.error("رمز عبور جدید دقیقا مطابق رمز عبور قبلی است.", {
          position: "top-center",
        });
        return;
      }

      await changePasswordAction(currentPassword, newPassword, confirmPassword);
      toast.success("رمز عبور با موفقیت تغییر یافت.", {
        position: "top-center",
      });
    });
  };

  const invalidPasswordInput = () => {
    toast.error("رمز عبور باید حداقل دارای ۸ کاراکتر باشد.", {
      position: "top-center",
      toastId: newPassword,
    });
  };

  return (
    <div className="flex-auto flex items-center justify-center px-2" dir="rtl">
      <div className="p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">تغییر رمز عبور</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-base mb-1 font-medium text-gray-700">
              رمز عبور فعلی
            </label>
            <input
              minLength={5}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
              onInvalid={invalidPasswordInput}
            />
          </div>
          <div className="mb-4">
            <label className="block text-base mb-1 font-medium text-gray-700">
              رمز عبور جدید
            </label>
            <input
              minLength={5}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
              onInvalid={invalidPasswordInput}
            />
          </div>
          <div className="mb-4">
            <label className="block text-base mb-1 font-medium text-gray-700">
              تکرار رمز عبور جدید
            </label>
            <input
              minLength={5}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
              onInvalid={invalidPasswordInput}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white p-2 roundedtransition"
          >
            {isPending ? "در حال انجام..." : "تغییر رمز عبور"}
          </button>
        </form>
      </div>
    </div>
  );
}
