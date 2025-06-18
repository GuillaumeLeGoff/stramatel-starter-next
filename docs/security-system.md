# Système de Sécurité - Indicateurs Digitaux

## Vue d'ensemble

Ce système permet de gérer les événements de sécurité et de calculer automatiquement les indicateurs digitaux demandés, incluant :

- **Date et heure actuelles**
- **Nombre de jours sans accident** (global, avec arrêt, sans arrêt)
- **Records de sécurité**
- **Compteurs annuels et mensuels**
- **Statistiques personnalisées**

## Structure de la Base de Données

### Modèle SecurityEvent
```prisma
model SecurityEvent {
  id          Int      @id @default(autoincrement())
  type        SecurityEventType
  date        DateTime
  description String?
  location    String?
  severity    SecuritySeverity?
  withWorkStop Boolean @default(false)
  createdBy   Int
  user        User     @relation(fields: [createdBy], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Modèle SecurityIndicators
```prisma
model SecurityIndicators {
  id                                      Int       @id @default(autoincrement())
  lastAccidentDate                        DateTime?
  lastAccidentWithStopDate                DateTime?
  lastAccidentWithoutStopDate             DateTime?
  recordStartDate                         DateTime?
  currentDaysWithoutAccident              Int       @default(0)
  currentDaysWithoutAccidentWithStop      Int       @default(0)
  currentDaysWithoutAccidentWithoutStop   Int       @default(0)
  recordDaysWithoutAccident               Int       @default(0)
  recordDaysWithoutAccidentDate           DateTime?
  yearlyAccidentsCount                    Int       @default(0)
  yearlyAccidentsWithStopCount            Int       @default(0)
  yearlyAccidentsWithoutStopCount         Int       @default(0)
  yearlyMinorCareCount                    Int       @default(0)
  yearlyNearMissCount                     Int       @default(0)
  yearlyDangerousSituationCount           Int       @default(0)
  monthlyAccidentsCount                   Int       @default(0)
  referenceYear                           Int
  referenceMonth                          Int
  updatedAt                               DateTime  @updatedAt
  updatedBy                               Int
  user                                    User      @relation(fields: [updatedBy], references: [id])
}
```

## Types d'Événements

```typescript
enum SecurityEventType {
  ACCIDENT = 'ACCIDENT',
  ACCIDENT_WITH_STOP = 'ACCIDENT_WITH_STOP',
  ACCIDENT_WITHOUT_STOP = 'ACCIDENT_WITHOUT_STOP',
  MINOR_CARE = 'MINOR_CARE',
  NEAR_MISS = 'NEAR_MISS',
  DANGEROUS_SITUATION = 'DANGEROUS_SITUATION'
}

enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

## API Endpoints

### Indicateurs Digitaux

#### `GET /api/security/indicators`
Récupère tous les indicateurs digitaux actuels.

**Paramètres optionnels :**
- `days` : Nombre de jours pour le calcul personnalisé (ex: `?days=30`)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "currentDate": "18/06/2024",
    "currentTime": "14:30:25",
    "daysWithoutAccident": 157,
    "daysWithoutAccidentWithStop": 157,
    "daysWithoutAccidentWithoutStop": 157,
    "recordDaysWithoutAccident": 157,
    "lastAccidentDate": "15/01/2024",
    "currentYearAccidents": 1,
    "currentYearAccidentsWithStop": 1,
    "currentYearAccidentsWithoutStop": 0,
    "currentYearMinorCare": 0,
    "currentYearNearMiss": 1,
    "currentYearDangerousSituations": 1,
    "currentMonthAccidents": 0,
    "accidentsLast30Days": 0
  }
}
```

#### `POST /api/security/indicators`
Force la mise à jour des indicateurs.

**Corps de la requête :**
```json
{
  "userId": 1
}
```

### Événements de Sécurité

#### `GET /api/security/events`
Récupère la liste des événements avec filtres optionnels.

**Paramètres optionnels :**
- `type` : Type d'événement
- `startDate` : Date de début (ISO string)
- `endDate` : Date de fin (ISO string)
- `location` : Lieu
- `severity` : Sévérité

#### `POST /api/security/events`
Crée un nouvel événement de sécurité.

**Corps de la requête :**
```json
{
  "type": "ACCIDENT_WITH_STOP",
  "date": "2024-06-18T10:30:00.000Z",
  "description": "Chute dans les escaliers",
  "location": "Escalier principal",
  "severity": "MEDIUM",
  "withWorkStop": true,
  "createdBy": 1
}
```

#### `GET /api/security/events/:id`
Récupère un événement spécifique.

#### `PUT /api/security/events/:id`
Modifie un événement existant.

#### `DELETE /api/security/events/:id`
Supprime un événement.

### Statistiques

#### `GET /api/security/statistics`
Récupère les statistiques avancées.

**Paramètres optionnels :**
- `year` : Année pour les statistiques (défaut: année actuelle)

## Utilisation du Service

### Créer un événement
```typescript
import { SecurityService } from '@/features/security/services/securityService';
import { SecurityEventType, SecuritySeverity } from '@/features/security/types';

const event = await SecurityService.createSecurityEvent({
  type: SecurityEventType.ACCIDENT,
  date: new Date(),
  description: 'Description de l\'accident',
  location: 'Atelier B',
  severity: SecuritySeverity.HIGH,
  withWorkStop: true,
  createdBy: 1
});
```

### Récupérer les indicateurs
```typescript
const indicators = await SecurityService.getDigitalIndicators();
console.log(`Jours sans accident: ${indicators.daysWithoutAccident}`);
```

### Calculer les accidents sur une période
```typescript
const accidents30Days = await SecurityService.getAccidentsLastXDays(30);
console.log(`Accidents des 30 derniers jours: ${accidents30Days}`);
```

## Utilisation du Client API

```typescript
import { SecurityApi } from '@/features/security/api/securityApi';

// Récupérer les indicateurs
const indicators = await SecurityApi.getDigitalIndicators();

// Créer un événement
const event = await SecurityApi.createSecurityEvent({
  type: 'ACCIDENT',
  date: new Date().toISOString(),
  description: 'Description',
  createdBy: 1
});

// Récupérer les statistiques
const stats = await SecurityApi.getSecurityStatistics(2024);
```

## Mise à jour Automatique

Le système utilise un service cron (`SecurityCronService`) qui :

1. **Met à jour les compteurs quotidiens** (chaque jour à minuit)
2. **Recalcule les indicateurs** après chaque événement
3. **Vérifie les records** automatiquement
4. **Met à jour les compteurs mensuels et annuels**

## Initialisation

Pour initialiser le système :

```bash
# Générer le client Prisma
pnpm prisma generate

# Appliquer les migrations
pnpm prisma migrate deploy

# Initialiser les données de sécurité
npx ts-node scripts/init-security.ts
```

## Configuration Cron

Le service cron est configuré dans `src/lib/scheduler.js` :

```javascript
// Met à jour les compteurs chaque jour à minuit
cron.schedule('0 0 * * *', async () => {
  await SecurityCronService.updateDailyCounters();
});

// Met à jour les compteurs mensuels le 1er de chaque mois
cron.schedule('0 0 1 * *', async () => {
  await SecurityCronService.updateMonthlyCounters();
});
```

## Exemples d'Utilisation

### Affichage des indicateurs pour un tableau de bord
```typescript
const summary = await SecurityApi.getQuickSummary();
// Retourne: { daysWithoutAccident, thisYearAccidents, thisMonthAccidents, lastAccidentDate }
```

### Calcul d'accidents sur une période personnalisée
```typescript
const accidents = await SecurityApi.getAccidentsForPeriod(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

## Sécurité et Validation

- **Validation des types** d'événements
- **Vérification des dates** 
- **Contrôle d'accès** par utilisateur
- **Historique complet** des modifications
- **Recalcul automatique** des indicateurs

## Personnalisation

Le système peut être étendu pour :
- Ajouter de nouveaux types d'événements
- Créer des indicateurs personnalisés
- Intégrer des notifications
- Exporter des rapports
- Configurer des seuils d'alerte 