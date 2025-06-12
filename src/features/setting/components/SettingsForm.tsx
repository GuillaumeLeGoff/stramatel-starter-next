import { useEffect, useState, useCallback } from "react";
import { useSettings, useUserSettings } from "../hooks";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { AppSettings, UserSettings } from "../types";
import { 
  Key, 
  Shield, 
  Monitor, 
  Sun, 
  Settings2, 
  User, 
  Globe, 
  Palette, 
  Maximize,
  Eye
} from "lucide-react";

export function SettingsForm() {
  const { settings, isLoading, error, updateSettings } = useSettings();
  const { 
    userSettings, 
    isLoading: isUserLoading, 
    error: userError, 
    updateUserSettings, 
    changePassword,
    clearError
  } = useUserSettings();
  const [appData, setAppData] = useState<Partial<AppSettings>>({});
  const [userData, setUserData] = useState<Partial<UserSettings>>({});
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState<{
    app: boolean;
    user: boolean;
  }>({ app: false, user: false });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (settings) {
      setAppData({
        brightness: settings.brightness,
        width: settings.width,
        height: settings.height,
        restartAt: settings.restartAt,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (userSettings) {
      setUserData({
        id: userSettings.id,
        username: userSettings.username,
        language: userSettings.language,
        theme: userSettings.theme,
        role: userSettings.role,
      });
    }
  }, [userSettings]);

    // Fonctions de sauvegarde
  const saveAppSettings = useCallback(async (data: Partial<AppSettings>) => {
    try {
      setIsSaving(prev => ({ ...prev, app: true }));
      const processedData = {
        ...data,
        brightness: data.brightness !== undefined ? Number(data.brightness) : undefined,
        width: data.width !== undefined ? Number(data.width) : undefined,
        height: data.height !== undefined ? Number(data.height) : undefined,
      };
      await updateSettings(processedData);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde automatique", err);
    } finally {
      setIsSaving(prev => ({ ...prev, app: false }));
    }
  }, [updateSettings]);

  const saveUserSettingsData = useCallback(async (data: Partial<Pick<UserSettings, "username" | "language" | "theme">>) => {
    try {
      setIsSaving(prev => ({ ...prev, user: true }));
      await updateUserSettings(data);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde automatique des paramètres utilisateur", err);
    } finally {
      setIsSaving(prev => ({ ...prev, user: false }));
    }
  }, [updateUserSettings]);

  // Sauvegarde automatique avec debounce
  const debouncedSaveApp = useDebounce(saveAppSettings, 800); // 800ms pour les paramètres app (inputs)
  const debouncedSaveAppSlider = useDebounce(saveAppSettings, 2000); // 2 secondes pour les sliders (plus de traffic)
  const debouncedSaveUser = useDebounce(saveUserSettingsData, 800); // 800ms pour les paramètres utilisateur

  const handleAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const name = e.target.name;

    const newData = {
      ...appData,
      [name]: value,
    };
    setAppData(newData);
    debouncedSaveApp(newData);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    const newData = {
      ...userData,
      [name]: value,
    };
    setUserData(newData);
    debouncedSaveUser(newData);
  };

  const handleSliderChange = (name: string, values: number[]) => {
    const newData = {
      ...appData,
      [name]: values[0],
    };
    setAppData(newData);
    debouncedSaveAppSlider(newData); // Utilise un debounce plus long pour les sliders
  };

  const handleSelectChange = (field: keyof UserSettings, value: string) => {
    const newData = {
      ...userData,
      [field]: value,
    };
    setUserData(newData);
    debouncedSaveUser(newData);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return; // Mots de passe ne correspondent pas
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Réinitialiser le formulaire et fermer le dialog
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      // L'erreur est déjà gérée par le store, pas besoin de faire quelque chose ici
    }
  };

  if (isLoading || isUserLoading) return (
    <div className="container mx-auto space-y-6">
      <Separator />
      
      {/* Skeleton pour les deux cartes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skeleton de la carte Application */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skeleton pour luminosité */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            <Separator className="my-4" />

            {/* Skeleton pour largeur/hauteur */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Skeleton pour résolution */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton de la carte Utilisateur */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skeleton pour nom d'utilisateur */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Skeleton pour langue/thème */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Skeleton pour sécurité */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  if (error || userError) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-destructive">
        Erreur: {error || userError}
      </div>
    </div>
  );

  if (!settings || !userSettings) return null;

  const isPasswordValid = passwordData.newPassword && passwordData.confirmPassword && 
    passwordData.newPassword === passwordData.confirmPassword;

  return (
    <div className="container mx-auto  space-y-6">
   
      <Separator />

      {/* Grille responsive avec les deux sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres de l'application */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-xl">Application</CardTitle>
              </div>
              {isSaving.app && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Sauvegarde...</span>
                </div>
              )}
            </div>
          <CardDescription>
              Paramètres globaux d&apos;affichage et de performance
          </CardDescription>
        </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <Label htmlFor="brightness" className="text-sm font-medium">
                    Luminosité
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {appData.brightness}%
                </Badge>
              </div>
              <Slider
              id="brightness"
                value={[appData.brightness || 0]}
                onValueChange={(values) => handleSliderChange("brightness", values)}
              min={0}
              max={100}
                step={1}
                className="w-full"
            />
          </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Maximize className="w-4 h-4 text-green-500" />
                  <Label htmlFor="width" className="text-sm font-medium">
                    Largeur (px)
                  </Label>
                </div>
            <Input
              id="width"
              name="width"
              type="number"
                  value={appData.width}
                  onChange={handleAppChange}
              min={10}
              max={3840}
                  className="text-center"
            />
          </div>

          <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-green-500" />
                  <Label htmlFor="height" className="text-sm font-medium">
                    Hauteur (px)
                  </Label>
                </div>
            <Input
              id="height"
              name="height"
              type="number"
                  value={appData.height}
                  onChange={handleAppChange}
              min={10}
              max={2160}
                  className="text-center"
                />
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4 text-green-500" />
                <span>Résolution: {appData.width} × {appData.height}</span>
              </div>
          </div>
        </CardContent>
        </Card>

        {/* Paramètres utilisateur */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-xl">Compte utilisateur</CardTitle>
              </div>
              {isSaving.user && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Sauvegarde...</span>
                </div>
              )}
            </div>
            <CardDescription>
              Préférences personnelles et sécurité du compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="username" className="text-sm font-medium">
                    Nom d&apos;utilisateur
                  </Label>
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={userData.username}
                  onChange={handleUserChange}
                  placeholder="Nom d'utilisateur"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <Label className="text-sm font-medium">Langue</Label>
                  </div>
                  <Select
                    value={userData.language}
                    onValueChange={(value) => handleSelectChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-pink-500" />
                    <Label className="text-sm font-medium">Thème</Label>
                  </div>
                  <Select
                    value={userData.theme}
                    onValueChange={(value) => handleSelectChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Clair</SelectItem>
                      <SelectItem value="dark">🌙 Sombre</SelectItem>
                      <SelectItem value="system">💻 Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <h4 className="text-sm font-semibold">Sécurité du compte</h4>
                </div>
              </div>
              
              <Dialog 
                open={isPasswordDialogOpen} 
                onOpenChange={(open) => {
                  setIsPasswordDialogOpen(open);
                  if (!open) {
                    // Effacer les erreurs et réinitialiser le formulaire quand on ferme
                    clearError();
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handlePasswordSubmit}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-orange-500" />
                        <span>Changer le mot de passe</span>
                      </DialogTitle>
                      <DialogDescription>
                        Entrez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-sm font-medium">
                          Mot de passe actuel
                        </Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium">
                          Nouveau mot de passe
                        </Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">
                          Confirmer le mot de passe
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      {passwordData.newPassword && passwordData.confirmPassword && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm">
                            {isPasswordValid ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-green-700">Les mots de passe correspondent</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                <span className="text-red-700">Les mots de passe ne correspondent pas</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {userError && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm text-red-700">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <span>{userError}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsPasswordDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!isPasswordValid || !passwordData.currentPassword}
                      >
                        Changer le mot de passe
          </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
      </Card>
      </div>

       
    </div>
  );
}
