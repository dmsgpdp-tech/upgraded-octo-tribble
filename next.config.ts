import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Agent SDK는 OS별 실행 파일을 함께 쓰므로 번들링하지 않고 node_modules에서 그대로 불러온다.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk", "lunar-javascript"],
};

export default nextConfig;
