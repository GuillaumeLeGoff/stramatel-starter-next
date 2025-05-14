"use client";

import { useParams } from "next/navigation";
import { DiaporamaDetails } from "@/features/diaporama";

export default function DiaporamaDetailRoute() {
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? parseInt(params.id)
      : Array.isArray(params.id)
      ? parseInt(params.id[0])
      : null;

  if (!id) {
    return <div>Identifiant du diaporama invalide</div>;
  }

  return <DiaporamaDetails diaporamaId={id} />;
}
