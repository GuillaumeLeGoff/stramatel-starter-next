import { useState } from "react";
import { DiaporamaFormData } from "../types";
import { useDiaporama } from "./useDiaporama";

export function useCreateDiaporama() {
  const { createDiaporama, isLoading, error } = useDiaporama();

  const [formData, setFormData] = useState<DiaporamaFormData>({
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
      const result = await createDiaporama(formData);
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
      // L'erreur est déjà gérée dans le hook useDiaporama
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
