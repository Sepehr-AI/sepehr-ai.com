// import MillionLint from "@million/lint";
import type { NextConfig } from "next";

const config: NextConfig = {
  allowedDevOrigins: ["sepehr-ai.com"],
  experimental: {
    nodeMiddleware: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async headers() {
    return process.env.NODE_ENV === "production"
      ? [
          {
            // matching API routes
            source: "/:path*",
            headers: [
              {
                key: "Access-Control-Allow-Origin",
                value: "https://sepehr-ai.com",
              },
              { key: "Access-Control-Allow-Credentials", value: "true" },
              {
                key: "Access-Control-Allow-Methods",
                value: "GET,DELETE,PATCH,POST,PUT",
              },
              {
                key: "Access-Control-Allow-Headers",
                value:
                  "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
              },
            ],
          },
        ]
      : [];
  },
  // async headers() {
  //   return [
  //     {
  //       source: "/dashboard/chat",
  //       headers: [
  //         {
  //           key: "Cache-Control",
  //           value: "max-age=3600, stale-while-revalidate=4000",
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default config;
