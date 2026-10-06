import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API, admin, Next internals, the OG image routes and any file with an extension
  matcher: ["/((?!api|admin|og|_next|_vercel|.*\\..*).*)"],
};
