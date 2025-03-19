import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Les langues supportées par ton application
  locales: ["fr", "en"],

  // Langue par défaut
  defaultLocale: "fr",

  // Optionnel: URLs localisées (ex: "produits" en français, "products" en anglais)
  // pathnames: {
  //   '/products': {
  //     fr: '/produits',
  //     en: '/products'
  //   }
  // }
});
