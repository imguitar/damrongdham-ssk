# 🏫 Damrongdham SSK

ระบบเว็บแอปพลิเคชันโรงเรียนดำรงธรรม ศรีสะเกษ — พัฒนาด้วย React + Express + MySQL บน Docker

## 🛠️ Tech Stack

| Layer        | เทคโนโลยี                         |
|--------------|------------------------------------|
| Frontend     | React 18 + Vite 5                  |
| Backend      | Node.js 20 + Express 4             |
| Database     | MySQL 8.0                          |
| DB Admin     | phpMyAdmin                         |
| Container    | Docker Compose                     |
| IDE          | Antigravity IDE (SKILL.md)         |

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (รวม Docker Compose)
- [Git](https://git-scm.com/)
- *(ไม่ต้องติดตั้ง Node.js หรือ MySQL บนเครื่อง — ทุกอย่างอยู่ใน Docker)*

## 🚀 เริ่มต้นใช้งาน

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/<username>/damrongdham-ssk.git
cd damrongdham-ssk

# 2. สร้างไฟล์ .env
cp .env.example .env
# (แก้ไขค่า password ตามต้องการ)

# 3. เริ่มทุก service
docker compose up --build

# 4. เปิดเบราว์เซอร์
# Frontend:  http://localhost:5173
# Backend:   http://localhost:5001/api
# phpMyAdmin: http://localhost:8081
```

## 🌐 Port Mapping

| Service       | URL                           | Host Port | Container Port |
|---------------|-------------------------------|----------:|---------------:|
| **Frontend**  | http://localhost:5173          |    `5173` |         `5173` |
| **Backend**   | http://localhost:5001/api      |    `5001` |         `5001` |
| **MySQL**     | `mysql -h 127.0.0.1 -P 3307`  |    `3307` |         `3306` |
| **phpMyAdmin**| http://localhost:8081          |    `8081` |           `80` |

## 🐳 คำสั่ง Docker ที่ใช้บ่อย

```bash
# เริ่ม (background)
docker compose up -d --build

# หยุด (เก็บข้อมูล)
docker compose down

# หยุด + ลบข้อมูล DB
docker compose down -v

# ดู logs
docker compose logs -f
docker compose logs -f backend

# เข้า container
docker compose exec backend sh
docker compose exec db mysql -u root -p

# สถานะ
docker compose ps
```

## 📂 โครงสร้างโฟลเดอร์

```
damrongdham-ssk/
├── docker-compose.yml
├── .env                    # ⚠️ ไม่ถูก commit (อยู่ใน .gitignore)
├── .env.example            # ตัวอย่าง environment variables
│
├── frontend/               # ⚛️ React + Vite
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
├── backend/                # 🟢 Node.js + Express
│   ├── Dockerfile.dev
│   ├── package.json
│   └── src/
│
├── db/                     # 🐬 MySQL
│   └── init/
│       └── 01-init.sql
│
├── docs/                   # 📝 Prompt templates
│   ├── 1-prompt-docker.txt
│   ├── 2-prompt-skill-template.txt
│   └── 3-prompt-git-github.txt
│
└── .agents/                # 🤖 Antigravity IDE
    └── skills/
        └── damrongdham-dev/
            └── SKILL.md
```

## 👨‍💻 ผู้พัฒนา

- **Supachai** — โรงเรียนดำรงธรรม ศรีสะเกษ

## 📄 License

MIT License
