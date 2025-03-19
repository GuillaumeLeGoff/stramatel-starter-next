import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// API de navigation qui prennent en compte la configuration de routage
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
