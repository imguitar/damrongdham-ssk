'use strict';

/**
 * ติดตั้ง Rich Menu ของ LINE Official Account
 *
 *   node backend/scripts/setupLineRichMenu.js <path-to-image.png> [path-to-richmenu.json]
 *
 * - ต้องมี LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ใน environment (ห้าม hardcode)
 * - ภาพต้องเป็น PNG/JPEG ขนาดตรงกับ size ใน richmenu.json (ค่าเริ่มต้น 2500x1686)
 * - สคริปต์นี้เรียก API ทางการของ LINE โดยตรง (ไม่ต้องติดตั้ง SDK เพิ่ม)
 *   ref: https://developers.line.biz/en/reference/messaging-api/#rich-menu
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || '';
const API = 'https://api.line.me/v2/bot';
const DATA_API = 'https://api-data.line.me/v2/bot';

const die = (msg) => { console.error(`✖ ${msg}`); process.exit(1); };

const main = async () => {
  if (!TOKEN) die('ไม่พบ LINE_MESSAGING_CHANNEL_ACCESS_TOKEN (ตั้งใน .env ก่อนรัน)');

  const imagePath = process.argv[2];
  const menuPath = process.argv[3] || path.join(__dirname, '../../docs/line/richmenu.json');
  if (!imagePath) die('ระบุไฟล์ภาพ rich menu: node backend/scripts/setupLineRichMenu.js <image.png>');
  if (!fs.existsSync(imagePath)) die(`ไม่พบไฟล์ภาพ: ${imagePath}`);
  if (!fs.existsSync(menuPath)) die(`ไม่พบไฟล์ rich menu: ${menuPath}`);

  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  const ext = path.extname(imagePath).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

  // 1) สร้าง rich menu
  const createRes = await fetch(`${API}/richmenu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(menu),
  });
  if (!createRes.ok) die(`สร้าง rich menu ไม่สำเร็จ (${createRes.status}): ${await createRes.text()}`);
  const { richMenuId } = await createRes.json();
  console.log(`✔ สร้าง rich menu แล้ว: ${richMenuId}`);

  // 2) อัปโหลดภาพ
  const uploadRes = await fetch(`${DATA_API}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, Authorization: `Bearer ${TOKEN}` },
    body: fs.readFileSync(imagePath),
  });
  if (!uploadRes.ok) die(`อัปโหลดภาพไม่สำเร็จ (${uploadRes.status}): ${await uploadRes.text()}`);
  console.log('✔ อัปโหลดภาพแล้ว');

  // 3) ตั้งเป็นเมนูเริ่มต้นของผู้ใช้ทุกคน
  const defaultRes = await fetch(`${API}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!defaultRes.ok) die(`ตั้งเป็นเมนูเริ่มต้นไม่สำเร็จ (${defaultRes.status}): ${await defaultRes.text()}`);

  console.log('✔ ตั้งเป็น default rich menu ของ OA เรียบร้อย');
  console.log('  ตรวจสอบ: เปิดแชตกับ OA แล้วกดปุ่มเมนูด้านล่าง');
};

main().catch((err) => die(err.message));
