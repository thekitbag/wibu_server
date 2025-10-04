import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_JOURNEY_TOKEN = 'demo-journey-paris';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // First, attempt to find and delete any existing demo journey to prevent duplicates
    console.log('🔍 Checking for existing demo journey...');
    const existingJourney = await prisma.journey.findFirst({
      where: {
        OR: [
          { id: 'demo-journey-id' },
          { shareableToken: DEMO_JOURNEY_TOKEN }
        ]
      },
      include: { stops: true }
    });

    if (existingJourney) {
      console.log(`🗑️  Removing existing demo journey: ${existingJourney.title}`);
      await prisma.journey.delete({
        where: { id: existingJourney.id }
      });
      console.log('✅ Existing demo journey removed');
    }

    // Create the new demo journey
    console.log('🏗️  Creating new demo journey...');
    const demoJourney = await prisma.journey.create({
      data: {
        id: 'demo-journey-id', // Fixed ID for test preservation
        title: 'A Romantic Trip to Paris',
        paid: true,
        shareableToken: DEMO_JOURNEY_TOKEN,
        stops: {
          create: [
            {
              title: 'Eiffel Tower at Sunset',
              note: 'We\'ll climb to the second floor just as the golden hour begins. The view will be breathtaking, and I know this will be the perfect moment to tell you how much you mean to me. Paris will spread out below us like a dream.',
              image_url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&h=600&fit=crop',
              external_url: 'https://www.toureiffel.paris/en/rates-opening-times',
              order: 1
            },
            {
              title: 'Café de Flore Morning',
              note: 'Our first morning in Paris will start with café au lait and fresh croissants at this legendary café. I\'ll practice my French beforehand, but I\'m sure you\'ll still laugh at my pronunciation. It will be perfect.',
              image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
              external_url: 'https://cafedeflore.fr/en/',
              order: 2
            },
            {
              title: 'Seine River Cruise',
              note: 'As we float down the Seine at twilight, Notre-Dame glowing in the distance, you\'ll rest your head on my shoulder. The gentle lapping of water and the soft lights reflecting on the river will make everything feel magical.',
              image_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
              external_url: 'https://www.bateauxparisiens.com/',
              order: 3
            }
          ]
        }
      },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log(`✨ Demo journey created successfully!`);
    console.log(`📋 Journey: ${demoJourney.title}`);
    console.log(`🔗 Shareable token: ${demoJourney.shareableToken}`);
    console.log(`📍 Stops created: ${demoJourney.stops.length}`);

    demoJourney.stops.forEach((stop, index) => {
      console.log(`   ${index + 1}. ${stop.title}`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });