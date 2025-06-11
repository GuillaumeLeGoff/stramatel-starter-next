import { useEffect, useState } from "react";
import { useSettings } from "../hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Settings } from "../types";

export function SettingsForm() {
  const { settings, isLoading, error, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        standby: settings.standby,
        brightness: settings.brightness,
        width: settings.width,
        height: settings.height,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const processedData = {
        ...formData,
        brightness:
          formData.brightness !== undefined
            ? Number(formData.brightness)
            : undefined,
        width:
          formData.width !== undefined ? Number(formData.width) : undefined,
        height:
          formData.height !== undefined ? Number(formData.height) : undefined,
      };

      await updateSettings(processedData);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des paramètres", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { name: string; value: boolean | number }
  ) => {
    const target = "target" in e ? e.target : e;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) return <div>Chargement des paramètres...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!settings) return null;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de l&apos;application</CardTitle>
          <CardDescription>
            Configurez les paramètres globaux de l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="standby">Mode veille</Label>
              <CardDescription>
                Activer/désactiver le mode veille
              </CardDescription>
            </div>
            <Switch
              id="standby"
              name="standby"
              checked={formData.standby}
              onCheckedChange={(checked) =>
                handleChange({ name: "standby", value: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brightness">Luminosité</Label>
            <Input
              id="brightness"
              name="brightness"
              type="number"
              value={formData.brightness}
              onChange={handleChange}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Largeur d&apos;affichage (px)</Label>
            <Input
              id="width"
              name="width"
              type="number"
              value={formData.width}
              onChange={handleChange}
              min={10}
              max={3840}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Hauteur d&apos;affichage (px)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              min={10}
              max={2160}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
