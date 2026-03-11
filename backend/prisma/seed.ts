import { PrismaClient, HotelPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // SuperAdmin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@hotelwifi.io' },
    update: {},
    create: {
      email: 'admin@hotelwifi.io',
      passwordHash: superAdminPassword,
    },
  });
  console.log('SuperAdmin created:', superAdmin.email);

  // Sample Hotel
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  const hotel = await prisma.hotel.upsert({
    where: { slug: 'sample-hotel' },
    update: {},
    create: {
      name: 'Sample Hotel',
      slug: 'sample-hotel',
      brandColor: '#2563EB',
      plan: HotelPlan.PROFESSIONAL,
      webhookSecret,
    },
  });
  console.log('Hotel created:', hotel.name);

  // Hotel Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const hotelAdmin = await prisma.hotelAdmin.upsert({
    where: { email: 'manager@sample-hotel.com' },
    update: {},
    create: {
      hotelId: hotel.id,
      email: 'manager@sample-hotel.com',
      passwordHash: adminPassword,
      role: 'MANAGER',
    },
  });
  console.log('HotelAdmin created:', hotelAdmin.email);

  // Bandwidth Profiles
  const standardProfile = await prisma.bandwidthProfile.upsert({
    where: { id: 'standard-profile-id' },
    update: {},
    create: {
      id: 'standard-profile-id',
      hotelId: hotel.id,
      name: 'Standard',
      downloadKbps: 10240,   // 10 Mbps
      uploadKbps: 5120,      // 5 Mbps
    },
  });

  const vipProfile = await prisma.bandwidthProfile.upsert({
    where: { id: 'vip-profile-id' },
    update: {},
    create: {
      id: 'vip-profile-id',
      hotelId: hotel.id,
      name: 'VIP',
      downloadKbps: 51200,   // 50 Mbps
      uploadKbps: 25600,     // 25 Mbps
    },
  });
  console.log('BandwidthProfiles created: Standard (10Mbps), VIP (50Mbps)');

  // Sample Rooms
  const roomNumbers = ['101', '102', '103', '201', '202', '301'];
  for (const number of roomNumbers) {
    await prisma.room.upsert({
      where: { hotelId_number: { hotelId: hotel.id, number } },
      update: {},
      create: {
        hotelId: hotel.id,
        number,
        floor: number.charAt(0),
        maxDevices: 3,
        bandwidthProfileId: number.startsWith('3') ? vipProfile.id : standardProfile.id,
      },
    });
  }
  console.log('Rooms created:', roomNumbers.join(', '));

  // Portal Config
  await prisma.portalConfig.upsert({
    where: { hotelId: hotel.id },
    update: {},
    create: {
      hotelId: hotel.id,
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      welcomeText: 'Welcome to Sample Hotel! Please log in to access WiFi.',
      languages: ['en', 'th', 'zh', 'ja', 'ko', 'ar'],
    },
  });
  console.log('PortalConfig created');

  console.log('\n=== Seed Complete ===');
  console.log('SuperAdmin: admin@hotelwifi.io / superadmin123');
  console.log('HotelAdmin: manager@sample-hotel.com / admin123');
  console.log('Hotel slug: sample-hotel');
  console.log('Webhook secret:', webhookSecret.substring(0, 8) + '...');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
