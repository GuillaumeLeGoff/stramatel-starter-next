import { useState } from "react";
import { SlideshowFormData } from "../types";
import { useSlideshow } from "./useSlideshow";

export function useCreateSlideshow() {
  const { createSlideshow, isLoading, error } = useSlideshow();

  const [formData, setFormData] = useState<SlideshowFormData>({
    name: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createSlideshow(formData);
      if (result) {
        // Réinitialiser le formulaire après une création réussie
        setFormData({
          name: "",
          description: "",
        });
        return result;
      }
      return null;
    } catch {
      // L'erreur est déjà gérée dans le hook useSlideshow
      return null;
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleChange,
    handleSubmit,
  };
}
