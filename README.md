# Install List Manager

เว็บแอปสำหรับสร้างและจัดการรายการโปรแกรมที่ต้องติดตั้ง (Install List) บน server

## Tech Stack

- **Frontend:** Angular 19
- **Backend:** NestJS 11
- **Database:** MariaDB
- **Auth:** Session-based (express-session + bcrypt)

## เริ่มต้นใช้งาน

### 1. Database (MariaDB)

```bash
docker compose up -d
```

หรือ import schema เอง:

```bash
mysql -u root -p < api/database/init.sql
```

### 2. API

```bash
cd api
cp .env.example .env   # แก้ค่า DB ตามต้องการ
npm install
npm run start:dev
```

API รันที่ `http://localhost:3000/api`

### 3. Web

```bash
cd web
npm install
npm start
```

Web รันที่ `http://localhost:4200`

## บัญชีเริ่มต้น

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Super Admin |

## โครงสร้างโปรเจกต์

```
├── api/                 # NestJS backend
│   ├── database/        # SQL init script
│   └── src/
│       ├── auth/        # Login / session
│       ├── users/       # User management
│       ├── programs/    # Program CRUD
│       ├── install-lists/
│       ├── roles/       # Permission matrix
│       └── audit-logs/
├── web/                 # Angular frontend
└── docker-compose.yml   # MariaDB
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | เข้าสู่ระบบ |
| POST | /api/auth/logout | ออกจากระบบ |
| GET | /api/auth/me | ข้อมูล user + menus |
| GET/POST/PUT/DELETE | /api/programs | จัดการ programs |
| GET/POST/PUT/DELETE | /api/install-lists | จัดการ install lists |
| GET/POST/PUT/DELETE | /api/users | จัดการ users |
| GET/PUT | /api/roles/permissions | Permission matrix |
| GET | /api/audit-logs | Audit log |
| GET | /api/settings | ตั้งค่าระบบ |

## Git Repository Structure (แนะนำ)

```
/scripts/{program-name}/
  ├── offline.sh
  ├── docker.sh
  └── online.sh
```

ชื่อ folder ตรงกับ field `name` ใน programs table
