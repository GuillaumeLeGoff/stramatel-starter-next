#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';
import { SecurityService } from '../src/features/security/services/securityService';
import { SecurityEventType, SecuritySeverity } from '../src/features/security/types';

const prisma = new PrismaClient();

async function initSecurity() {
  console.log('🔧 Initialisation du système de sécurité...');

  try {
    // Vérifier si un utilisateur existe
    const existingUser = await prisma.user.findFirst();
    let systemUserId = 1;

    if (!existingUser) {
      console.log('👤 Création d\'un utilisateur système...');
      const systemUser = await prisma.user.create({
        data: {
          username: 'system',
          password: 'system_password', // À changer en production
          language: 'fr',
          theme: 'light',
          role: 'ADMIN'
        }
      });
      systemUserId = systemUser.id;
      console.log('✅ Utilisateur système créé avec l\'ID:', systemUserId);
    } else {
      systemUserId = existingUser.id;
      console.log('✅ Utilisateur existant trouvé avec l\'ID:', systemUserId);
    }

    // Initialiser les indicateurs de sécurité
    console.log('📊 Initialisation des indicateurs de sécurité...');
    await SecurityService.initializeIndicators(systemUserId);

    // Créer quelques événements de test (optionnel)
    console.log('🔬 Création d\'événements de test...');
    
    const testEvents = [
      {
        type: SecurityEventType.ACCIDENT_WITH_STOP,
        date: new Date('2024-01-15'),
        description: 'Chute dans l\'atelier de production',
        location: 'Atelier A',
        severity: SecuritySeverity.MEDIUM,
        withWorkStop: true,
        createdBy: systemUserId
      },
      {
        type: SecurityEventType.NEAR_MISS,
        date: new Date('2024-03-20'),
        description: 'Presque collision entre deux véhicules',
        location: 'Parking',
        severity: SecuritySeverity.LOW,
        withWorkStop: false,
        createdBy: systemUserId
      },
      {
        type: SecurityEventType.DANGEROUS_SITUATION,
        date: new Date('2024-06-10'),
        description: 'Produit chimique renversé non signalé',
        location: 'Laboratoire',
        severity: SecuritySeverity.HIGH,
        withWorkStop: false,
        createdBy: systemUserId
      }
    ];

    for (const eventData of testEvents) {
      await SecurityService.createSecurityEvent(eventData);
      console.log(`✅ Événement créé: ${eventData.type} - ${eventData.description}`);
    }

    // Afficher les indicateurs créés
    console.log('\n📈 Indicateurs actuels:');
    const indicators = await SecurityService.getDigitalIndicators();
    
    console.log(`- Jours sans accident: ${indicators.daysWithoutAccident}`);
    console.log(`- Jours sans accident avec arrêt: ${indicators.daysWithoutAccidentWithStop}`);
    console.log(`- Jours sans accident sans arrêt: ${indicators.daysWithoutAccidentWithoutStop}`);
    console.log(`- Record de jours sans accident: ${indicators.recordDaysWithoutAccident}`);
    console.log(`- Dernière date d'accident: ${indicators.lastAccidentDate?.toLocaleDateString('fr-FR') || 'Aucun'}`);
    console.log(`- Accidents cette année: ${indicators.currentYearAccidents}`);
    console.log(`- Soins bénins cette année: ${indicators.currentYearMinorCare}`);
    console.log(`- Presqu'accidents cette année: ${indicators.currentYearNearMiss}`);
    console.log(`- Situations dangereuses cette année: ${indicators.currentYearDangerousSituations}`);
    console.log(`- Accidents ce mois: ${indicators.currentMonthAccidents}`);

    console.log('\n🎉 Initialisation terminée avec succès!');
    console.log('\n📋 Endpoints disponibles:');
    console.log('- GET /api/security/indicators - Récupérer les indicateurs');
    console.log('- GET /api/security/indicators?days=30 - Accidents des 30 derniers jours');
    console.log('- POST /api/security/events - Créer un événement');
    console.log('- GET /api/security/events - Lister les événements');
    console.log('- GET /api/security/statistics - Statistiques');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour nettoyer les données de test
async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    await prisma.securityEvent.deleteMany({});
    await prisma.securityIndicators.deleteMany({});
    console.log('✅ Données de test nettoyées');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clean') {
    cleanTestData();
  } else {
    initSecurity();
  }
}

export { initSecurity, cleanTestData }; 