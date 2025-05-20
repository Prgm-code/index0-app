import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  /* config options here */
  // experimental: {
  //   viewTransition: true,
  // },
  allowedDevOrigins: ["http://localhost:3000"],
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
