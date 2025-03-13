"use server";

import AuthLayout from "./Layout";
import {
  checkEmailAction,
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
    email?: string;
    error?: string;
    exists?: string;
    selectedPlan?: string;
  }>;
}) {
  await redirectToDashboardIfUserAuth();
  const searchParams = await props.searchParams;
  const {
    email: _email,
    exists,
    error: _error,
    selectedPlan: _selectedPlan,
  } = searchParams;
  const selectedPlan: number | undefined = !isNaN(Number(_selectedPlan))
    ? Number(_selectedPlan)
    : undefined;
  const email = _email ? decodeURIComponent(_email) : undefined;
  const error = _error ? decodeURIComponent(_error) : undefined;

  async function checkEmail(formData: FormData) {
    "use server";

    return checkEmailAction(formData, selectedPlan);
  }
  async function login(formData: FormData) {
    "use server";

    return loginAction(formData, selectedPlan);
  }
  async function register(formData: FormData) {
    "use server";

    return registerAction(formData, selectedPlan);
  }

  return (
    <AuthLayout
      exists={exists}
      email={email}
      error={error}
      login={login}
      register={register}
      checkEmail={checkEmail}
    />
  );
}
