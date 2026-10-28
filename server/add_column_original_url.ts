import { prisma } from './src/database/prisma.js';

async function main() {
  console.log('[DB MIGRATION] Adding original_url column to courses table...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS original_url VARCHAR(1000);
  `);
  console.log('[DB MIGRATION] Column original_url ensured!');

  // Update existing courses with realistic original URLs
  const courses = await prisma.course.findMany({ select: { id: true, code: true, title: true } });
  console.log(`[DB MIGRATION] Found ${courses.length} courses in PostgreSQL.`);

  for (const c of courses) {
    let url = 'https://coloso.global/';
    const code = c.code.toLowerCase();
    const title = c.title.toLowerCase();

    if (code.includes('free-01') || title.includes('blender')) {
      url = 'https://cloud.blender.org/training/';
    } else if (code.includes('free-02') || title.includes('davinci')) {
      url = 'https://www.blackmagicdesign.com/products/davinciresolve/training';
    } else if (code.includes('free-03') || title.includes('landscape') || title.includes('thủy mặc')) {
      url = 'https://www.domestika.org/en/courses/traditional-illustration';
    } else if (code.includes('free-04') || title.includes('unreal')) {
      url = 'https://dev.epicgames.com/community/learning';
    } else if (code.includes('free-05') || title.includes('photoshop')) {
      url = 'https://www.artstation.com/learning';
    } else if (code.includes('free-06') || title.includes('âm thanh') || title.includes('foley')) {
      url = 'https://coloso.global/en/products/sounddirector-limheekyung-us';
    } else if (code.includes('free-07') || title.includes('after effects')) {
      url = 'https://coloso.global/en/products/motiondesigner-jundam-us';
    } else if (code.includes('free-08') || title.includes('màu nước') || title.includes('watercolor')) {
      url = 'https://www.domestika.org/en/courses/watercolor-techniques';
    } else if (code.includes('484')) {
      url = 'https://coloso.global/en/products/filmdirector-leekyungmi-us';
    } else {
      url = `https://coloso.global/en/search?q=${encodeURIComponent(c.code.replace(/[^a-zA-Z0-9]/g, ''))}`;
    }

    await prisma.course.update({
      where: { id: c.id },
      data: { originalUrl: url },
    });
  }

  console.log('[DB MIGRATION] Updated all courses with originalUrl successfully!');
}

main()
  .catch((e) => {
    console.error('[DB MIGRATION ERROR]', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
