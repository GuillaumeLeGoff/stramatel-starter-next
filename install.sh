#!/bin/bash

# Script de déploiement automatique Starter-Industrie
# Gère le téléchargement et déploiement depuis GitHub Releases
# Compatible avec repositories privés et publics

set -e

# Configuration
REPO_OWNER="StramatelBE"
REPO_NAME="Starter-Industrie"
DEPLOY_DIR="/var/www/html"
BACKUP_DIR="/var/backups/nextjs"
BACKUP_SUFFIX=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="/tmp/starter-industrie-deploy-$$"

# Fichier de configuration pour le token
CONFIG_DIR="$HOME/.config/starter-industrie"
CONFIG_FILE="$CONFIG_DIR/config"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Charger le token depuis la configuration
load_saved_token() {
    if [ -f "$CONFIG_FILE" ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ ^GITHUB_TOKEN=\"(.*)\"$ ]]; then
                local token="${BASH_REMATCH[1]}"
                if [ -n "$token" ]; then
                    echo "$token"
                    return 0
                fi
            fi
        done < "$CONFIG_FILE"
    fi
    return 1
}

# Récupérer le token GitHub automatiquement
get_github_token() {
    local token=""

    # 1. Variable d'environnement
    if [ -n "${GITHUB_TOKEN:-}" ]; then
        token="$GITHUB_TOKEN"
        if [ "$DEBUG" = "true" ]; then
            log_info "✅ Token trouvé via GITHUB_TOKEN"
        fi
    elif [ -n "${GH_TOKEN:-}" ]; then
        token="$GH_TOKEN"
        if [ "$DEBUG" = "true" ]; then
            log_info "✅ Token trouvé via GH_TOKEN"
        fi
    fi

    # 2. Configuration sauvegardée
    if [ -z "$token" ]; then
        if token=$(load_saved_token 2>/dev/null); then
            if [ "$DEBUG" = "true" ]; then
                log_info "✅ Token trouvé via configuration sauvegardée"
            fi
        fi
    fi

    # 3. Git credentials
    if [ -z "$token" ] && [ -f "$HOME/.git-credentials" ]; then
        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 Recherche dans git-credentials..."
        fi

        token=$(grep "github.com" "$HOME/.git-credentials" 2>/dev/null | \
                grep -o 'https://[^:]*:\([^@]*\)@github.com' | \
                sed 's/https:\/\/[^:]*:\([^@]*\)@github.com/\1/' | \
                head -1)

        if [ -n "$token" ]; then
            if [ "$DEBUG" = "true" ]; then
                log_info "✅ Token trouvé via git-credentials"
            fi
        fi
    fi

    # 4. Git credential helper
    if [ -z "$token" ]; then
        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 Tentative avec git credential helper..."
        fi
        token=$(echo "protocol=https
host=github.com" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2)

        if [ -n "$token" ]; then
            if [ "$DEBUG" = "true" ]; then
                log_info "✅ Token trouvé via git credential helper"
            fi
        fi
    fi

    if [ -n "$token" ]; then
        echo "$token"
        return 0
    else
        if [ "$DEBUG" = "true" ]; then
            log_error "❌ Aucun token trouvé"
        fi
        return 1
    fi
}

# Fonction curl pour l'API GitHub
github_api_call() {
    local url="$1"
    local output_file="$2"
    local accept_header="${3:-application/vnd.github+json}"

    local curl_result
    local http_code

    if [ -n "$output_file" ]; then
        # Téléchargement vers un fichier
        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 API call: $url -> $output_file"
        fi

        if [ -n "$GITHUB_TOKEN" ]; then
            http_code=$(curl -s -L -w "%{http_code}" \
                -H "Authorization: token $GITHUB_TOKEN" \
                -H "Accept: $accept_header" \
                -o "$output_file" "$url")
        else
            http_code=$(curl -s -L -w "%{http_code}" \
                -H "Accept: $accept_header" \
                -o "$output_file" "$url")
        fi
        curl_result=$?

        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 Code HTTP: $http_code, curl result: $curl_result"
        fi

        if [ $curl_result -ne 0 ]; then
            log_error "Erreur curl (code $curl_result)"
            return 1
        fi

        if [ "$http_code" -ge 400 ]; then
            log_error "Erreur HTTP $http_code"
            case "$http_code" in
                401) log_error "Erreur d'authentification - vérifiez votre token GitHub" ;;
                403) log_error "Accès refusé - vérifiez les permissions de votre token" ;;
                404) log_error "Ressource non trouvée" ;;
            esac
            return 1
        fi

        if [ ! -s "$output_file" ]; then
            log_error "Fichier téléchargé vide"
            return 1
        fi

    else
        # Requête simple
        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 API call: $url"
        fi

        local response=""
        if [ -n "$GITHUB_TOKEN" ]; then
            response=$(curl -s -L -w "HTTPCODE:%{http_code}" \
                -H "Authorization: token $GITHUB_TOKEN" \
                -H "Accept: $accept_header" "$url")
        else
            response=$(curl -s -L -w "HTTPCODE:%{http_code}" \
                -H "Accept: $accept_header" "$url")
        fi
        curl_result=$?

        if [ $curl_result -ne 0 ]; then
            log_error "Erreur curl (code $curl_result)"
            return 1
        fi

        # Extraire le code HTTP et le contenu
        http_code=$(echo "$response" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
        local content=$(echo "$response" | sed 's/HTTPCODE:[0-9]*$//')

        if [ "$DEBUG" = "true" ]; then
            log_info "🔍 Code HTTP: $http_code"
        fi

        if [ "$http_code" -ge 400 ]; then
            log_error "Erreur HTTP $http_code"
            case "$http_code" in
                401) log_error "Erreur d'authentification - vérifiez votre token GitHub" ;;
                403) log_error "Accès refusé - vérifiez les permissions de votre token" ;;
                404) log_error "Ressource non trouvée" ;;
            esac
            return 1
        fi

        echo "$content"
    fi

    return 0
}

# Lister les releases disponibles
list_releases() {
    log_info "Récupération des releases disponibles..."
    local releases_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"

    local releases_json=$(github_api_call "$releases_url")
    if [ -z "$releases_json" ]; then
        log_error "Impossible de récupérer les releases"
        return 1
    fi

    echo "📋 Releases disponibles:"
    if command -v jq >/dev/null 2>&1; then
        echo "$releases_json" | jq -r '.[] | "  🏷️  \(.tag_name) - \(.name) \(if .prerelease then "(DEV)" else "(PROD)" end)"' 2>/dev/null
    else
        # Fallback sans jq
        echo "$releases_json" | grep -E '"tag_name"|"name"|"prerelease"' | \
        while IFS= read -r line; do
            if echo "$line" | grep -q '"tag_name"'; then
                tag=$(echo "$line" | sed -E 's/.*"([^"]+)".*/\1/')
                echo -n "  🏷️  $tag"
            elif echo "$line" | grep -q '"name"'; then
                name=$(echo "$line" | sed -E 's/.*"([^"]+)".*/\1/')
                echo -n " - $name"
            elif echo "$line" | grep -q '"prerelease"'; then
                prerelease=$(echo "$line" | sed -E 's/.*: *([^,]+).*/\1/')
                if [ "$prerelease" = "true" ]; then
                    echo " (DEV)"
                else
                    echo " (PROD)"
                fi
            fi
        done
    fi
}

# Obtenir les informations d'une release
get_release_info() {
    local version_type="$1"
    local base_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"

    case "$version_type" in
        "latest"|"")
            # Essayer /latest d'abord
            if [ "$DEBUG" = "true" ]; then
                log_info "🔍 Tentative d'accès à /latest..."
            fi

            local temp_file="/tmp/latest_release_$$"
            local http_code=$(curl -s -L -w "%{http_code}" \
                ${GITHUB_TOKEN:+-H "Authorization: token $GITHUB_TOKEN"} \
                -o "$temp_file" "${base_url}/latest")

            if [ "$http_code" = "200" ] && [ -s "$temp_file" ]; then
                if [ "$DEBUG" = "true" ]; then
                    log_info "✅ Release stable trouvée via /latest"
                fi
                cat "$temp_file"
                rm -f "$temp_file"
            else
                rm -f "$temp_file"
                if [ "$DEBUG" = "true" ]; then
                    log_warning "Pas de release stable, utilisation de la dernière"
                fi
                local all_releases=$(github_api_call "$base_url")
                if [ -n "$all_releases" ]; then
                    if command -v jq >/dev/null 2>&1; then
                        echo "$all_releases" | jq '.[0]' 2>/dev/null
                    else
                        echo "$all_releases" | sed -n '1,/^  }/p'
                    fi
                else
                    return 1
                fi
            fi
            ;;
        "dev")
            # Première prerelease
            if [ "$DEBUG" = "true" ]; then
                log_info "🔍 Recherche de la dernière prerelease..."
            fi

            local all_releases=$(github_api_call "$base_url")
            if [ -n "$all_releases" ]; then
                if command -v jq >/dev/null 2>&1; then
                    local dev_release=$(echo "$all_releases" | jq '.[] | select(.prerelease == true) | select(.draft == false)' 2>/dev/null | jq -s '.[0]' 2>/dev/null)
                    if [ -n "$dev_release" ] && [ "$dev_release" != "null" ]; then
                        echo "$dev_release"
                    else
                        echo "$all_releases" | jq '.[0]' 2>/dev/null
                    fi
                else
                    echo "$all_releases" | sed -n '1,/^  }/p'
                fi
            else
                return 1
            fi
            ;;
        "prod")
            # Première release stable
            if [ "$DEBUG" = "true" ]; then
                log_info "🔍 Recherche de la dernière release stable..."
            fi

            local all_releases=$(github_api_call "$base_url")
            if command -v jq >/dev/null 2>&1; then
                local prod_release=$(echo "$all_releases" | jq '.[] | select(.prerelease == false) | select(.draft == false)' 2>/dev/null | jq -s '.[0]' 2>/dev/null)
                if [ -n "$prod_release" ] && [ "$prod_release" != "null" ]; then
                    echo "$prod_release"
                else
                    log_error "Aucune release stable trouvée"
                    return 1
                fi
            else
                echo "$all_releases" | awk '/"prerelease": false/,/^  }/' | head -50
            fi
            ;;
        *)
            # Version spécifique
            if [ "$DEBUG" = "true" ]; then
                log_info "🔍 Recherche de la version spécifique: $version_type"
            fi
            github_api_call "${base_url}/tags/$version_type"
            ;;
    esac
}

# Télécharger l'asset via l'API GitHub
download_asset_via_api() {
    local version_type="$1"
    local output_file="$2"
    local asset_name="starter-industrie.tar.gz"

    if [ "$DEBUG" = "true" ]; then
        log_info "🔍 Téléchargement via API GitHub..."
    fi

    # Obtenir les informations de la release
    local release_info=$(get_release_info "$version_type")
    if [ -z "$release_info" ]; then
        log_error "Impossible de récupérer les informations de release"
        return 1
    fi

    # Extraire l'asset ID
    local asset_id=""
    if command -v jq >/dev/null 2>&1; then
        asset_id=$(echo "$release_info" | jq -r ".assets[]? | select(.name == \"$asset_name\") | .id" 2>/dev/null)
        if [ -z "$asset_id" ] || [ "$asset_id" = "null" ]; then
            log_error "Asset $asset_name non trouvé dans la release"
            return 1
        fi
    else
        # Fallback sans jq
        local asset_info=$(echo "$release_info" | grep -A 10 -B 2 "\"name\": \"$asset_name\"")
        asset_id=$(echo "$asset_info" | grep '"id":' | head -1 | grep -o '[0-9]*' | head -1)
        if [ -z "$asset_id" ]; then
            log_error "Asset $asset_name non trouvé dans la release"
            return 1
        fi
    fi

    if [ "$DEBUG" = "true" ]; then
        log_info "🔍 Asset ID trouvé: $asset_id"
    fi

    # Télécharger via l'API
    local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/$asset_id"

    if [ "$DEBUG" = "true" ]; then
        log_info "🔍 URL API: $api_url"
    fi

    if github_api_call "$api_url" "$output_file" "application/octet-stream"; then
        log_success "✅ Téléchargement réussi via API GitHub"
        return 0
    else
        log_error "❌ Échec du téléchargement via API"
        return 1
    fi
}

# Télécharger directement (repository public)
download_direct() {
    local version_type="$1"
    local output_file="$2"

    if [ "$DEBUG" = "true" ]; then
        log_info "🔍 Téléchargement direct (repository public)..."
    fi

    # Obtenir les informations de la release
    local release_info=$(get_release_info "$version_type")
    if [ -z "$release_info" ]; then
        log_error "Impossible de récupérer les informations de release"
        return 1
    fi

    # Extraire l'URL de téléchargement direct
    local download_url=""
    if command -v jq >/dev/null 2>&1; then
        download_url=$(echo "$release_info" | jq -r '.assets[]? | select(.name == "starter-industrie.tar.gz") | .browser_download_url' 2>/dev/null)
        if [ -z "$download_url" ] || [ "$download_url" = "null" ]; then
            log_error "URL de téléchargement non trouvée"
            return 1
        fi
    else
        # Fallback sans jq
        download_url=$(echo "$release_info" | grep -A 5 '"name": "starter-industrie.tar.gz"' | grep '"browser_download_url"' | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/')
        if [ -z "$download_url" ]; then
            log_error "URL de téléchargement non trouvée"
            return 1
        fi
    fi

    if [ "$DEBUG" = "true" ]; then
        log_info "🔍 URL de téléchargement: $download_url"
    fi

    # Télécharger directement
    if curl -L -o "$output_file" "$download_url" 2>/dev/null; then
        log_success "✅ Téléchargement direct réussi"
        return 0
    else
        log_error "❌ Échec du téléchargement direct"
        return 1
    fi
}

# Créer une sauvegarde
create_backup() {
    if [ "$NO_BACKUP" = "true" ]; then
        log_info "🚫 Sauvegarde désactivée (--no-backup)"
        return 0
    fi

    if [ ! -d "$DEPLOY_DIR" ]; then
        log_info "📁 Pas de déploiement existant à sauvegarder"
        return 0
    fi

    log_info "💾 Création de la sauvegarde..."

    # Créer le dossier de sauvegarde
    sudo mkdir -p "$BACKUP_DIR"

    local backup_path="${BACKUP_DIR}/backup-${BACKUP_SUFFIX}"

    if sudo cp -r "$DEPLOY_DIR" "$backup_path" 2>/dev/null; then
        log_success "✅ Sauvegarde créée: $backup_path"
        return 0
    else
        log_error "❌ Échec de la sauvegarde"
        return 1
    fi
}

# Nettoyer les anciennes sauvegardes
cleanup_backups() {
    local keep_count=${1:-5}

    if [ ! -d "$BACKUP_DIR" ]; then
        return 0
    fi

    log_info "🧹 Nettoyage des anciennes sauvegardes (garde les $keep_count dernières)..."

    local backups=$(ls -dt "$BACKUP_DIR"/backup-* 2>/dev/null | tail -n +$((keep_count + 1)))

    if [ -n "$backups" ]; then
        local count=0
        while IFS= read -r backup; do
            if sudo rm -rf "$backup" 2>/dev/null; then
                log_info "  🗑️  Supprimé: $(basename "$backup")"
                ((count++))
            fi
        done <<< "$backups"

        if [ $count -gt 0 ]; then
            log_success "🧹 $count anciennes sauvegardes supprimées"
        fi
    else
        log_info "🧹 Aucune sauvegarde à nettoyer"
    fi
}

# Installer l'application
install_application() {
    local archive_path="$1"

    log_info "📦 Installation de l'application..."

    # Créer une sauvegarde
    create_backup

    # Créer le dossier temporaire d'extraction
    local extract_dir="$TEMP_DIR/extract"
    mkdir -p "$extract_dir"

    # Extraire l'archive
    if tar -xzf "$archive_path" -C "$extract_dir" 2>/dev/null; then
        log_success "✅ Archive extraite avec succès"
    else
        log_error "❌ Échec de l'extraction de l'archive"
        return 1
    fi

    # Préparer le dossier de déploiement
    sudo mkdir -p "$DEPLOY_DIR"

    # Installer les fichiers
    if sudo cp -r "$extract_dir"/* "$DEPLOY_DIR/" 2>/dev/null; then
        log_success "✅ Fichiers installés dans $DEPLOY_DIR"
    else
        log_error "❌ Échec de l'installation des fichiers"
        return 1
    fi

    # Fixer les permissions
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"

    # Installer les dépendances si nécessaire
    if [ -f "$DEPLOY_DIR/package.json" ]; then
        log_info "📦 Installation des dépendances npm..."
        if (cd "$DEPLOY_DIR" && sudo -u www-data npm install --production 2>/dev/null); then
            log_success "✅ Dépendances installées"
        else
            log_warning "⚠️ Problème lors de l'installation des dépendances"
        fi
    fi

    # Redémarrer nginx
    if [ "$NO_RESTART" != "true" ]; then
        if command -v nginx >/dev/null 2>&1; then
            log_info "🔄 Redémarrage de nginx..."
            if sudo systemctl restart nginx 2>/dev/null; then
                log_success "✅ Nginx redémarré"
            else
                log_warning "⚠️ Problème lors du redémarrage de nginx"
            fi
        fi
    fi

    log_success "🎉 Installation terminée avec succès!"
    return 0
}

# Tester le token GitHub
test_github_token() {
    log_info "🧪 Test du token GitHub..."

    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "Aucun token configuré"
        return 1
    fi

    # Test 1: Vérifier le token lui-même
    log_info "🔍 Test 1: Vérification du token..."
    local user_info=$(github_api_call "https://api.github.com/user")

    if [ -n "$user_info" ] && echo "$user_info" | grep -q '"login"'; then
        local username=$(echo "$user_info" | grep '"login"' | cut -d'"' -f4)
        log_success "Token valide pour l'utilisateur: $username"
    else
        log_error "Token invalide ou expiré"
        return 1
    fi

    # Test 2: Accès au repository
    log_info "🔍 Test 2: Accès au repository ${REPO_OWNER}/${REPO_NAME}..."
    local repo_info=$(github_api_call "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}")

    if [ -n "$repo_info" ] && echo "$repo_info" | grep -q '"name"'; then
        log_success "Accès au repository autorisé"
    else
        log_error "Pas d'accès au repository ou repository inexistant"
        return 1
    fi

    log_success "🎉 Token correctement configuré !"
    return 0
}

# Lister les sauvegardes
list_backups() {
    log_info "📋 Sauvegardes disponibles:"

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "Aucune sauvegarde trouvée"
        return 1
    fi

    local backups=$(ls -dt "$BACKUP_DIR"/backup-* 2>/dev/null)

    if [ -n "$backups" ]; then
        while IFS= read -r backup; do
            local backup_name=$(basename "$backup")
            local timestamp=$(echo "$backup_name" | sed 's/^backup-//')
            local formatted_date=$(echo "$timestamp" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
            echo "  🗃️  $backup_name ($formatted_date)"
        done <<< "$backups"
    else
        log_warning "Aucune sauvegarde trouvée"
        return 1
    fi

    return 0
}

# Restaurer depuis une sauvegarde
restore_backup() {
    local backup_name="$1"

    if [ -z "$backup_name" ]; then
        # Prendre la dernière sauvegarde
        local latest_backup=$(ls -dt "$BACKUP_DIR"/backup-* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            backup_name=$(basename "$latest_backup")
        else
            log_error "Aucune sauvegarde trouvée"
            return 1
        fi
    fi

    local backup_path="$BACKUP_DIR/$backup_name"

    if [ ! -d "$backup_path" ]; then
        log_error "Sauvegarde non trouvée: $backup_name"
        return 1
    fi

    log_info "🔄 Restauration depuis: $backup_name"

    # Sauvegarder l'état actuel
    if [ -d "$DEPLOY_DIR" ]; then
        local temp_backup="${DEPLOY_DIR}_temp_$(date +%Y%m%d_%H%M%S)"
        if sudo mv "$DEPLOY_DIR" "$temp_backup" 2>/dev/null; then
            log_info "Sauvegarde temporaire créée: $(basename "$temp_backup")"
        fi
    fi

    # Restaurer la sauvegarde
    if sudo cp -r "$backup_path" "$DEPLOY_DIR" 2>/dev/null; then
        log_success "✅ Restauration réussie"

        # Fixer les permissions
        sudo chown -R www-data:www-data "$DEPLOY_DIR"
        sudo chmod -R 755 "$DEPLOY_DIR"

        # Redémarrer nginx
        if [ "$NO_RESTART" != "true" ] && command -v nginx >/dev/null 2>&1; then
            sudo systemctl restart nginx 2>/dev/null
            log_success "✅ Nginx redémarré"
        fi

        return 0
    else
        log_error "❌ Échec de la restauration"
        return 1
    fi
}

# Fonction principale
main() {
    local version_type="${1:-latest}"

    log_info "🚀 Déploiement Starter-Industrie ($version_type)..."
    log_info "📁 Dossier de déploiement: $DEPLOY_DIR"

    # Récupérer le token GitHub si nécessaire
    if [ -z "$GITHUB_TOKEN" ]; then
        GITHUB_TOKEN=$(get_github_token)
        if [ -z "$GITHUB_TOKEN" ]; then
            log_warning "⚠️ Aucun token GitHub configuré - tentative de téléchargement public"
        else
            log_info "🔐 Token GitHub configuré"
        fi
    fi

    # Créer les dossiers
    mkdir -p "$TEMP_DIR"

    # Télécharger l'archive
    local archive_path="$TEMP_DIR/starter-industrie.tar.gz"

    log_info "📥 Téléchargement de la release ($version_type)..."

    # Essayer le téléchargement via API d'abord (pour les repos privés)
    if [ -n "$GITHUB_TOKEN" ]; then
        if download_asset_via_api "$version_type" "$archive_path"; then
            log_success "✅ Téléchargement réussi via API"
        else
            log_warning "⚠️ Échec API, tentative de téléchargement direct..."
            if download_direct "$version_type" "$archive_path"; then
                log_success "✅ Téléchargement direct réussi"
            else
                log_error "❌ Échec de tous les téléchargements"
                cleanup_temp
                exit 1
            fi
        fi
    else
        # Téléchargement direct pour les repos publics
        if download_direct "$version_type" "$archive_path"; then
            log_success "✅ Téléchargement direct réussi"
        else
            log_error "❌ Échec du téléchargement"
            cleanup_temp
            exit 1
        fi
    fi

    # Vérifier l'archive
    if [ ! -s "$archive_path" ]; then
        log_error "❌ Archive vide ou corrompue"
        cleanup_temp
        exit 1
    fi

    # Installer l'application
    if install_application "$archive_path"; then
        log_success "🎉 Déploiement terminé avec succès!"

        # Nettoyer les anciennes sauvegardes
        cleanup_backups

        # Informations finales
        echo ""
        log_info "📊 Résumé du déploiement:"
        log_info "   Version: $version_type"
        log_info "   Dossier: $DEPLOY_DIR"
        log_info "   Archive: $(basename "$archive_path")"

        if [ -f "$DEPLOY_DIR/package.json" ]; then
            log_info "   Type: Application server"
        else
            log_info "   Type: Application statique"
        fi

        echo ""
        log_info "🔗 URLs disponibles:"
        log_info "   • http://localhost"
        log_info "   • http://localhost/fr/live"

        if [ "$NO_RESTART" != "true" ]; then
            echo ""
            log_info "💡 Services redémarrés automatiquement"
        fi
    else
        log_error "❌ Échec du déploiement"
        cleanup_temp
        exit 1
    fi

    # Nettoyage
    cleanup_temp
}

# Nettoyer les fichiers temporaires
cleanup_temp() {
    rm -rf "$TEMP_DIR"
}

# Piège pour nettoyer en cas d'interruption
trap cleanup_temp EXIT

# Fonction d'aide
show_help() {
    cat << EOF
Usage: $0 [COMMAND] [VERSION] [OPTIONS]

Déploie Starter-Industrie depuis GitHub Releases

COMMANDES:
  deploy [VERSION]     Déployer une version (commande par défaut)
  restore [BACKUP]     Restaurer depuis une sauvegarde
  cleanup [COUNT]      Nettoyer les anciennes sauvegardes

ARGUMENTS:
  VERSION             Version à déployer:
                      - latest (défaut): Dernière release stable
                      - dev: Dernière release de développement
                      - prod: Dernière release de production
                      - VERSION_TAG: Version spécifique

OPTIONS:
  -l, --list           Lister les releases disponibles
  --list-backups       Lister les sauvegardes disponibles
  --test-token         Tester le token GitHub
  --no-backup          Ne pas sauvegarder avant déploiement
  --no-restart         Ne pas redémarrer nginx
  --debug              Mode debug avec informations détaillées
  -h, --help           Afficher cette aide

EXEMPLES:
  $0                   # Déployer la dernière version
  $0 dev               # Déployer la version dev
  $0 prod              # Déployer la version prod
  $0 v20240101-120000-prod # Déployer une version spécifique
  $0 restore           # Restaurer la dernière sauvegarde
  $0 cleanup 10        # Garder 10 sauvegardes
  $0 -l                # Lister les versions
  $0 --test-token      # Tester le token GitHub

Variables d'environnement:
  GITHUB_TOKEN         Token GitHub pour l'authentification
  GH_TOKEN             Token GitHub alternatif

EOF
}

# Gestion des arguments
COMMAND="deploy"
VERSION_TYPE=""
NO_BACKUP="false"
NO_RESTART="false"
DEBUG="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -l|--list)
            list_releases
            exit 0
            ;;
        --list-backups)
            list_backups
            exit 0
            ;;
        --test-token)
            if [ -z "$GITHUB_TOKEN" ]; then
                GITHUB_TOKEN=$(get_github_token)
            fi
            test_github_token
            exit $?
            ;;
        --no-backup)
            NO_BACKUP="true"
            shift
            ;;
        --no-restart)
            NO_RESTART="true"
            shift
            ;;
        --debug)
            DEBUG="true"
            shift
            ;;
        deploy)
            COMMAND="deploy"
            shift
            ;;
        restore)
            COMMAND="restore"
            shift
            ;;
        cleanup)
            COMMAND="cleanup"
            shift
            ;;
        -*)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
        *)
            case "$COMMAND" in
                deploy)
                    VERSION_TYPE="$1"
                    ;;
                restore)
                    BACKUP_NAME="$1"
                    ;;
                cleanup)
                    CLEANUP_COUNT="$1"
                    ;;
            esac
            shift
            ;;
    esac
done

# Exécuter la commande
case "$COMMAND" in
    deploy)
        main "$VERSION_TYPE"
        ;;
    restore)
        restore_backup "$BACKUP_NAME"
        ;;
    cleanup)
        cleanup_backups "${CLEANUP_COUNT:-5}"
        ;;
    *)
        log_error "Commande inconnue: $COMMAND"
        show_help
        exit 1
        ;;
esac