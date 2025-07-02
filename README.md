# stramatel-starter-next

## Raccourcis Clavier de l'Éditeur

L'éditeur Konva supporte maintenant les raccourcis clavier suivants :

### 📋 Copier/Coller
- **Ctrl+C** : Copier les éléments sélectionnés
- **Ctrl+V** : Coller les éléments copiés (décalés de 20px)



### 🗑️ Suppression
- **Delete** ou **Backspace** : Supprimer les éléments sélectionnés

### 🎯 Sélection
- **Escape** : Désélectionner tous les éléments
- **Clic + Ctrl/Cmd/Shift** : Sélection multiple

### 📊 Indicateurs Visuels

Dans le header de l'éditeur, vous verrez des indicateurs colorés :
- 📋 **Bleu** : Éléments sélectionnés
- 📄 **Vert** : Nombre d'éléments dans le clipboard

### 🔧 Fonctionnalités Techniques

- **Clipboard persistant** : Les éléments copiés restent disponibles jusqu'à la prochaine copie
- **Sélection préservée** : Les éléments collés sont automatiquement sélectionnés
- **IDs uniques** : Chaque élément collé reçoit un nouvel ID unique
- **Décalage automatique** : Les éléments collés sont décalés pour éviter la superposition

### 🚫 Limitations Actuelles

- Le clipboard est local à la session (non persistant entre rechargements)

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
