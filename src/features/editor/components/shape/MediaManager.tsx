import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Grid3X3,
  List,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  Type,
  HardDrive,
  FileType,
  ChevronDown,
} from "lucide-react";
import { useShapeMediaManager } from "@/features/editor/hooks";
import type { Media, SortOption } from "../../hooks/shape/useShapeMedia";

interface MediaManagerProps {
  onMediaSelect?: (media: Media) => void;
  addShape?: (
    shapeType: string,
    options?: { src?: string; name?: string; mediaId?: string }
  ) => Promise<void>;
  onMediaDeleted?: (mediaUrl: string) => Promise<void>;
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

// Composant skeleton pour le mode liste
const MediaListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`skeleton-${index}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-6 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Composant skeleton pour le mode grille
const MediaGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="aspect-square">
        <CardContent className="p-3 h-full flex flex-col">
          <Skeleton className="flex-1 rounded-md mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </>
);

export function MediaManager({ onMediaSelect, addShape, onMediaDeleted }: MediaManagerProps) {
  const {
    // État
    mediaToDelete,
    
    // État du hook useShapeMedia
    viewMode,
    sortBy,
    sortDirection,
    medias,
    loading,
    error,
    deletingMediaIds,
    
    // Actions
    setViewMode,
    setSortBy,
    getMediaTypeColor,
    
    // Gestionnaires d'événements
    handleMediaSelect,
    handleDeleteMedia,
    handleUpload,
    confirmDelete,
    cancelDelete,
    
    // Fonctions utilitaires
    getSortIcon,
    getSortLabel,
  } = useShapeMediaManager({
    onMediaSelect,
    addShape,
    onMediaDeleted,
  });

  // Fonction pour obtenir l'icône du critère de tri
  const getSortCriteriaIcon = (criteria: SortOption) => {
    switch (criteria) {
      case "date":
        return <Calendar className="h-3 w-3" />;
      case "name":
        return <Type className="h-3 w-3" />;
      case "size":
        return <HardDrive className="h-3 w-3" />;
      case "type":
        return <FileType className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {getSortIcon()}
                {getSortCriteriaIcon(sortBy)}
                {getSortLabel(sortBy)}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                <Button
                  variant={sortBy === "date" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSortBy("date")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Date
                  </div>
                  {sortBy === "date" && getSortIcon()}
                </Button>
                <Button
                  variant={sortBy === "name" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSortBy("name")}
                >
                  <div className="flex items-center gap-2">
                    <Type className="h-3 w-3" />
                    Nom
                  </div>
                  {sortBy === "name" && getSortIcon()}
                </Button>
                <Button
                  variant={sortBy === "size" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSortBy("size")}
                >
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3 w-3" />
                    Taille
                  </div>
                  {sortBy === "size" && getSortIcon()}
                </Button>
                <Button
                  variant={sortBy === "type" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSortBy("type")}
                >
                  <div className="flex items-center gap-2">
                    <FileType className="h-3 w-3" />
                    Type
                  </div>
                  {sortBy === "type" && getSortIcon()}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

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
      {medias.length === 0 && loading ? (
        // Affichage du skeleton complet quand aucun média et en chargement
        viewMode === "list" ? <MediaListSkeleton count={6} /> : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 pb-2">
              <MediaGridSkeleton count={8} />
            </div>
          </ScrollArea>
        )
      ) : medias.length !== 0 ? (
        viewMode === "list" ? (
          <>
            <div className="space-y-2 ">
              {medias.map((media) => {
                const isDeleting = deletingMediaIds.has(media.id);
                return (
                  <Card
                    key={media.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      isDeleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isDeleting && handleMediaSelect(media)}
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
                              className={`text-xs ${getMediaTypeColor(
                                media.type
                              )}`}
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
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDeleting) {
                              handleDeleteMedia(media.id, e);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Skeleton après les médias existants pendant le chargement */}
              {loading && <MediaListSkeleton count={3} />}
            </div>
          </>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 pb-2">
              {medias.map((media) => {
                const isDeleting = deletingMediaIds.has(media.id);
                return (
                  <Card
                    key={media.id}
                    className={`cursor-pointer hover:bg-accent transition-colors aspect-square ${
                      isDeleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isDeleting && handleMediaSelect(media)}
                  >
                    <CardContent className="p-3 h-full flex flex-col">
                      <div className="flex-1 flex items-center justify-center bg-muted rounded-md mb-2 overflow-hidden relative">
                        {media.type === "image" ? (
                          <Image
                            src={media.url}
                            alt={media.name}
                            fill
                            className="object-cover"
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
                            <Image
                              src={media.thumbnail.url}
                              alt={`Thumbnail de ${media.name}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement
                                  ?.querySelector(".fallback-icon")
                                  ?.classList.remove("hidden");
                              }}
                            />

                            <div className="absolute bottom-1 right-1 bg-black/70 rounded p-1">
                              <Video className="h-3 w-3 text-white" />
                            </div>
                          </>
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}

                        <div className="hidden fallback-icon">
                          {media.type === "image" ? (
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Video className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Overlay de suppression */}
                        {isDeleting && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium truncate">
                          {media.name}
                        </p>
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
                );
              })}
              {/* Skeleton après les médias existants pendant le chargement */}
              {loading && <MediaGridSkeleton count={4} />}
            </div>
          </ScrollArea>
        )
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun média disponible</p>
            <p className="text-xs">Uploadez vos premiers fichiers</p>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!mediaToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le média &quot;{mediaToDelete?.name}&quot; ?
              <br />
              <span className="text-destructive font-medium">
                Il sera également retiré de toutes les slides qui l&apos;utilisent.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
