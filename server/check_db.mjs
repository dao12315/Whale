import { prisma } from './dist/database/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
  });
  console.log('USERS IN DB:', JSON.stringify(users, null, 2));

  const courses = await prisma.course.findMany({
    select: { id: true, code: true, title: true, instructorName: true, instructorRole: true, authorAvatarUrl: true },
    take: 5
  });
  console.log('SAMPLE COURSES IN DB:', JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
