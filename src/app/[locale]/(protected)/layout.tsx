"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/shared/components/ui/sidebar";
import { Gauge, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized, logout, user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Liens de navigation
  const links = [
    {
      label: "Tableau de bord",
      href: "/dashboard",
      icon: <Gauge className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: (
        <Settings className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  // Fonction pour gérer la déconnexion
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  useEffect(() => {
    // Si l'authentification est initialisée et que l'utilisateur n'est pas connecté
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Ne rien afficher tant que l'authentification n'est pas initialisée
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé avec sidebar
  if (isAuthenticated) {
    return (
      <div className="h-screen flex flex-col md:flex-row bg-muted dark:bg-background overflow-hidden">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between h-full bg-sidebar text-sidebar-foreground">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="pt-4 border-t border-sidebar-border">
                <Link
                  href="#"
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center justify-start gap-2 group/sidebar py-2",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "px-2 rounded transition-colors"
                  )}
                >
                  <LogOut className="text-destructive h-5 w-5 flex-shrink-0" />
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                  >
                    Déconnexion
                  </motion.span>
                </Link>
              </div>
              {user && (
                <SidebarLink
                  link={{
                    label: user.username,
                    href: "#",
                    icon: (
                      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    ),
                  }}
                />
              )}
            </div>
          </SidebarBody>
        </Sidebar>

        <div className="flex flex-1 h-full overflow-auto">
          <div className="p-2 md:p-6 rounded-tl-2xl bg-card text-card-foreground border-l border-t border-border flex flex-col gap-2 flex-1 w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Ne rien afficher pendant la redirection
  return null;
}

// Logo complet pour la sidebar ouverte
const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-sidebar-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-sidebar-foreground whitespace-pre"
      >
        Stramatel
      </motion.span>
    </Link>
  );
};

// Logo réduit pour la sidebar fermée
const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-sidebar-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
