import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Créer le middleware i18n
const i18nMiddleware = createMiddleware(routing);

export default i18nMiddleware;

// Configurer les routes sur lesquelles le middleware doit s'exécuter
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
