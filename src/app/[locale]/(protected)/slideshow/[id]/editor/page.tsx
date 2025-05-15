"use client";

import { useParams, redirect } from "next/navigation";
import { useEffect } from "react";

export default function SlideshowEditorLegacyRoute() {
  const params = useParams();
  const slideshowId = params.id as string;
  const locale = params.locale as string || "fr";

  useEffect(() => {
    redirect(`/${locale}/editor/${slideshowId}`);
  }, [slideshowId, locale]);

  return null;
}
