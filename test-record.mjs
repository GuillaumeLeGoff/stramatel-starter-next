import { PrismaClient } from './prisma/generated/client/index.js';

const prisma = new PrismaClient();

async function testRecordCalculation() {
  try {
    console.log('=== Test de calcul du record ===\n');

    // Récupérer tous les événements
    const allEvents = await prisma.securityEvent.findMany({
      orderBy: { date: 'asc' },
      select: { 
        id: true, 
        date: true, 
        description: true, 
        isReference: true,
        withWorkStop: true
      }
    });

    console.log('Tous les événements:');
    allEvents.forEach(event => {
      console.log(`- ID: ${event.id}, Date: ${event.date.toISOString().split('T')[0]}, Référence: ${event.isReference}, Arrêt: ${event.withWorkStop}, Description: ${event.description}`);
    });

    // Récupérer seulement les événements non-référence
    const realEvents = allEvents.filter(e => !e.isReference);
    console.log(`\nÉvénements réels (non-référence): ${realEvents.length}`);

    if (realEvents.length === 0) {
      // Aucun événement réel, calculer depuis la référence
      const referenceEvent = allEvents.find(e => e.isReference);
      if (referenceEvent) {
        const today = new Date();
        const daysSinceReference = Math.floor((today.getTime() - referenceEvent.date.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`\nAucun événement réel. Record depuis la référence: ${daysSinceReference} jours`);
        console.log(`Date de référence: ${referenceEvent.date.toISOString().split('T')[0]}`);
      }
    } else {
      // Analyser les périodes
      let maxDaysWithoutAccident = 0;
      let recordStartDate = null;
      let recordEndDate = null;

      // Vérifier la période depuis la référence jusqu'au premier événement
      const referenceEvent = allEvents.find(e => e.isReference);
      if (referenceEvent && realEvents.length > 0) {
        const daysFromReferenceToFirst = Math.floor((realEvents[0].date.getTime() - referenceEvent.date.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`\nPériode depuis référence jusqu'au premier événement: ${daysFromReferenceToFirst} jours`);
        if (daysFromReferenceToFirst > maxDaysWithoutAccident) {
          maxDaysWithoutAccident = daysFromReferenceToFirst;
          recordStartDate = referenceEvent.date;
          recordEndDate = realEvents[0].date;
        }
      }

      // Vérifier les périodes entre les événements
      for (let i = 0; i < realEvents.length - 1; i++) {
        const daysBetween = Math.floor((realEvents[i + 1].date.getTime() - realEvents[i].date.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Période entre événement ${realEvents[i].id} et ${realEvents[i + 1].id}: ${daysBetween} jours`);
        if (daysBetween > maxDaysWithoutAccident) {
          maxDaysWithoutAccident = daysBetween;
          recordStartDate = realEvents[i].date;
          recordEndDate = realEvents[i + 1].date;
        }
      }

      // Vérifier la période depuis le dernier événement jusqu'à aujourd'hui
      const today = new Date();
      const daysSinceLastEvent = Math.floor((today.getTime() - realEvents[realEvents.length - 1].date.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Période depuis le dernier événement jusqu'à aujourd'hui: ${daysSinceLastEvent} jours`);
      if (daysSinceLastEvent > maxDaysWithoutAccident) {
        maxDaysWithoutAccident = daysSinceLastEvent;
        recordStartDate = realEvents[realEvents.length - 1].date;
        recordEndDate = today;
      }

      console.log(`\n=== RÉSULTAT ===`);
      console.log(`Record de jours sans accident: ${maxDaysWithoutAccident} jours`);
      if (recordStartDate) {
        console.log(`Début du record: ${recordStartDate.toISOString().split('T')[0]}`);
      }
      if (recordEndDate) {
        console.log(`Fin du record: ${recordEndDate.toISOString().split('T')[0]}`);
      }
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecordCalculation(); 