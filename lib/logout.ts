"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleLogout = async (router: any) => {
  const response = await fetch("/logout", {
    method: "POST",
    credentials: "same-origin",
  });

  if (response.redirected) {
    router.push(response.url);
  }
};
