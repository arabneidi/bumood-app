const { PrismaClient } = require('@prisma/client');

async function createUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating dummy-user...');
    
    // Create the user
    const user = await prisma.user.upsert({
      where: { id: 'dummy-user' },
      update: {},
      create: {
        id: 'dummy-user',
        name: 'Test User',
        email: 'test@example.com',
        gender: 'Other',
        age: 25,
        height: 170.0,
        weight: 70.0,
        personality: JSON.stringify(['Analytical', 'Creative']),
        universityLevel: 'Bachelor',
        fieldOfStudy: 'Computer Science',
        interests: JSON.stringify(['Technology', 'Health', 'Fitness']),
        favoriteWriters: 'J.K. Rowling, George Orwell',
        favoriteMovies: 'Inception, The Matrix',
        favoritePhilosophers: 'Socrates, Plato'
      }
    });
    
    console.log('✅ User created successfully:', user.id);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
