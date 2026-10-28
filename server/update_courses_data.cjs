const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'coursesData.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Regex to match each course block or replace instructor lines
// Let's inspect all instructor lines
const instructorMatches = content.match(/instructor:\s*'[^']+'/g);
console.log('Found instructor matches:', instructorMatches?.length);

const admin1 = {
  name: 'Tổng Quản Trị Viên (Admin)',
  role: 'Tổng Quản Trị Viên',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
};

const admin2 = {
  name: 'Admin Hải Nam',
  role: 'Quản trị viên kỹ thuật',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
};

let counter = 0;
// We can replace course-by-course
// Let's split by `{` and `id: 'course-` or replace `instructor: '...'`
content = content.replace(/(instructor:\s*')([^']+)'/g, (match, p1, p2) => {
  const chosen = (counter % 2 === 0) ? admin1 : admin2;
  counter++;
  return `${p1}${chosen.name}'`;
});

// Also replace instructorRole
let roleCounter = 0;
content = content.replace(/(instructorRole:\s*')([^']+)'/g, (match, p1, p2) => {
  const chosen = (roleCounter % 2 === 0) ? admin1 : admin2;
  roleCounter++;
  return `${p1}${chosen.role}'`;
});

// Also replace authorAvatar
let avatarCounter = 0;
content = content.replace(/(authorAvatar:\s*')([^']+)'/g, (match, p1, p2) => {
  const chosen = (avatarCounter % 2 === 0) ? admin1 : admin2;
  avatarCounter++;
  return `${p1}${chosen.avatar}'`;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated coursesData.ts with Admins!');
