const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
  });
  console.log('USERS IN DB:', JSON.stringify(users, null, 2));

  const courses = await p.course.findMany({
    select: { id: true, code: true, title: true, instructorName: true, instructorRole: true, authorAvatarUrl: true },
    take: 5
  });
  console.log('SAMPLE COURSES IN DB:', JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
