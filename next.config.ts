import type { NextConfig } from "next";
import { SERVER_ACTION_BODY_SIZE_LIMIT } from "@/lib/place-photos";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
};

export default nextConfig;
