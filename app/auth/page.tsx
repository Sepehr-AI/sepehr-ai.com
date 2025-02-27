"use server";

import { use } from "react";
import {
  checkEmailAction,
  loginAction,
  redirectToDashboardIfUserAuth,
  registerAction,
} from "./lib";

/**
 * The AuthPage component.
 * It reads query parameters to determine which step to show.
 */
export default async function AuthPage(props: {
  searchParams: Promise<{ email?: string; exists?: string; error?: string }>;
}) {
  await redirectToDashboardIfUserAuth();
  const searchParams = await props.searchParams;
  const { email, exists, error } = searchParams;

  // Step 1: Email entry form (if no email query parameter exists)
  if (!email) {
    return (
      <div
        style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}
      >
        <h2>Enter Your Email</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {/* 
          The form’s action is the server action `checkEmailAction` defined above.
          When submitted, it will redirect to `/auth?email=...&exists=...`
        */}
        <form action={checkEmailAction}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit">Next</button>
        </form>
      </div>
    );
  }

  // Step 2A: Login form (if the email exists)
  if (exists === "true") {
    return (
      <div
        style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}
      >
        <h2>Welcome Back!</h2>
        <p>Please enter your password to log in.</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {/* 
          The login form posts to the server action `loginAction`.
          The email is sent as a hidden field.
        */}
        <form action={loginAction}>
          <input type="hidden" name="email" value={email} />
          <p>Email: {email}</p>
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit">Login</button>
        </form>
        <p>
          <a href="/auth">Back</a>
        </p>
      </div>
    );
  }

  // Step 2B: Registration form (if the email does not exist)
  return (
    <div
      style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}
    >
      <h2>Create an Account</h2>
      <p>Please enter your password twice.</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* 
        The registration form posts to the server action `registerAction`.
        The email is sent as a hidden field.
      */}
      <form action={registerAction}>
        <input type="hidden" name="email" value={email} />
        <p>Email: {email}</p>
        <input
          type="text"
          name="userName"
          placeholder="Full name"
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone number"
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <button type="submit">Register</button>
      </form>
      <p>
        <a href="/auth">Back</a>
      </p>
    </div>
  );
}
