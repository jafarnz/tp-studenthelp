const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Delete all records in reverse order of dependencies
    console.log('Clearing database...');

    // Delete VerificationCode records
    await prisma.verificationCode.deleteMany();
    console.log('✓ Cleared verification codes');

    // Delete User records
    await prisma.user.deleteMany();
    console.log('✓ Cleared users');

    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
