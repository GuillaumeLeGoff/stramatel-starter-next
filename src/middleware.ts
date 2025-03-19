import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Pattern qui définit les routes concernées par le middleware
  matcher: ["/((?!api|trpc|_next|_vercel|_admin|_access|.*\\..*).*)"],
};
