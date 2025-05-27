import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Image as ImageIcon,
  Video,
  Upload,
  MoreVertical,
  Grid3X3,
  List,
  ArrowUpDown,
} from "lucide-react";
import {
  useMedias,
  type Media,
  type SortOption,
} from "@/features/editor/hooks";

interface MediaListProps {
  onMediaSelect?: (media: Media) => void;
  addShape?: (
    shapeType: string,
    options?: { src?: string; name?: string }
  ) => Promise<void>;
}

const getMediaIcon = (type: Media["type"]) => {
  switch (type) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    default:
      return <ImageIcon className="h-4 w-4" />;
  }
};

export function MediaList({ onMediaSelect, addShape }: MediaListProps) {
  const {
    viewMode,
    sortBy,
    medias,
    loading,
    error,
    setViewMode,
    setSortBy,
    selectMedia,
    getMediaTypeColor,
    uploadMedia,
  } = useMedias();

  const handleMediaSelect = async (media: Media) => {
    selectMedia(media);
    onMediaSelect?.(media);

    // Ajouter le média au canvas Konva
    if (addShape) {
      if (media.type === "image") {
        try {
          await addShape("image", {
            src: media.url,
            name: media.name,
          });
        } catch (error) {
          console.error("Erreur lors de l'ajout du média au canvas:", error);
        }
      } else if (media.type === "video") {
        // TODO: Implémenter le support des vidéos
        console.log("Support des vidéos à venir - média:", media.name);
      }
    }
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          await uploadMedia(files);
        } catch (error) {
          console.error("Erreur lors de l'upload:", error);
        }
      }
    };

    input.click();
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("list")}
          >
            <List className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="h-8 w-32">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="size">Taille</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleUpload}
            disabled={loading}
          >
            <Upload className="h-3 w-3 mr-1" />
            {loading ? "Upload..." : "Upload"}
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {medias.map((media) => (
              <Card
                key={media.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleMediaSelect(media)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getMediaIcon(media.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {media.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getMediaTypeColor(media.type)}`}
                        >
                          {media.type}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{media.size}</span>
                        <span>{media.uploadedAt}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Actions du menu (à implémenter plus tard)
                      }}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 pb-2 pr-2">
            {medias.map((media) => (
              <Card
                key={media.id}
                className="cursor-pointer hover:bg-accent transition-colors aspect-square"
                onClick={() => handleMediaSelect(media)}
              >
                <CardContent className="p-3 h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-muted rounded-md mb-2 overflow-hidden relative">
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback vers l'icône si l'image ne charge pas
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : media.thumbnail ? (
                      <>
                        <img
                          src={media.thumbnail.url}
                          alt={`Thumbnail de ${media.name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback vers l'icône si la thumbnail ne charge pas
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement
                              ?.querySelector(".fallback-icon")
                              ?.classList.remove("hidden");
                          }}
                        />
                        {/* Indicateur vidéo */}
                        <div className="absolute bottom-1 right-1 bg-black/70 rounded p-1">
                          <Video className="h-3 w-3 text-white" />
                        </div>
                      </>
                    ) : (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    )}
                    {/* Icône de fallback cachée par défaut */}
                    <div className="hidden fallback-icon">
                      {media.type === "image" ? (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium truncate">{media.name}</p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getMediaTypeColor(media.type)}`}
                      >
                        {media.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {media.size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {medias.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun média disponible</p>
            <p className="text-xs">Uploadez vos premiers fichiers</p>
          </div>
        </div>
      )}
    </div>
  );
}
