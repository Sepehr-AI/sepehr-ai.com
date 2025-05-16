/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import AuthLayout from "./Layout";
import {
  checkMobileAction,
  loginAction,
  registerAction,
  redirectToDashboardIfUserAuth,
} from "./lib";

/**
 * The AuthPage component.
 * It reads query parameters to determine which step to show.
 */
export default async function AuthPage(props: {
  searchParams: Promise<{
    otp?: string;
    email?: string;
    error?: string;
    userId?: string;
    mobile?: string;
    exists?: string;
    fullName?: string;
    selectedPlan?: string;
  }>;
}) {
  await redirectToDashboardIfUserAuth();
  const searchParams = await props.searchParams;
  const {
    exists,
    otp: _otp,
    email: _email,
    error: _error,
    mobile: _mobile,
    userId: _userId,
    fullName: _fullName,
    selectedPlan: _selectedPlan,
  } = searchParams;
  const otp = _otp ? decodeURIComponent(_otp) : undefined;
  const email = _email ? decodeURIComponent(_email) : undefined;
  const error = _error ? decodeURIComponent(_error) : undefined;
  const userId = _userId ? decodeURIComponent(_userId) : undefined;
  const mobile = _mobile ? decodeURIComponent(_mobile) : undefined;
  const fullName = _fullName ? decodeURIComponent(_fullName) : undefined;
  const selectedPlan: number | undefined = !isNaN(
    Number(decodeURIComponent(_selectedPlan || "abc")),
  )
    ? Number(decodeURIComponent(_selectedPlan || "abc"))
    : undefined;

  async function _checkMobileAction(_prev: any, formData: FormData) {
    "use server";
    return checkMobileAction(formData, selectedPlan);
  }
  async function _loginAction(_prev: any, formData: FormData) {
    "use server";
    return loginAction(formData, selectedPlan);
  }
  async function _registerAction(_prev: any, formData: FormData) {
    "use server";
    return registerAction(formData, selectedPlan);
  }

  return (
    <AuthLayout
      otp={otp}
      error={error}
      email={email}
      exists={exists}
      mobile={mobile}
      userId={userId}
      fullName={fullName}
      loginAction={_loginAction}
      registerAction={_registerAction}
      checkMobileAction={_checkMobileAction}
    />
  );
}
