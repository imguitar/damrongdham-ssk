# Backup & Restore Plan — DCMS

> อัปเดตล่าสุด: 2026-06-20 | Phase 15

---

## สิ่งที่ต้อง Backup

| รายการ | ที่อยู่ | ความถี่แนะนำ |
|--------|--------|------------|
| MySQL Database | Docker volume `mysql_data_prod` | ทุกวัน |
| ไฟล์แนบ (uploads) | Docker volume `app_uploads` | ทุกวัน |
| .env.production | `/opt/damrongdham-ssk/.env.production` | ทุกครั้งที่แก้ไข |
| nginx/ssl certs | `/opt/damrongdham-ssk/nginx/ssl/` | ทุกครั้งที่ renew |

---

## Backup — Database (MySQL)

### Manual Backup
```bash
# Dump database ออกเป็นไฟล์ .sql
docker exec damrongdham-db-prod \
  mysqldump -u damrongdham_user -p"$(grep MYSQL_PASSWORD /opt/damrongdham-ssk/.env.production | cut -d= -f2)" \
  damrongdham_db > /backup/dcms_db_$(date +%Y%m%d_%H%M%S).sql

# ตรวจสอบขนาดไฟล์
ls -lh /backup/dcms_db_*.sql
```

### Auto Backup (Cron)
```bash
# สร้าง script
cat > /opt/dcms-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/dcms"
RETAIN_DAYS=30
DB_PASS=$(grep MYSQL_PASSWORD /opt/damrongdham-ssk/.env.production | cut -d= -f2)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Dump DB
docker exec damrongdham-db-prod \
  mysqldump -u damrongdham_user -p"$DB_PASS" damrongdham_db \
  > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Backup uploads
docker run --rm \
  -v app_uploads:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf "/backup/uploads_$TIMESTAMP.tar.gz" -C /data .

# ลบไฟล์เก่ากว่า RETAIN_DAYS วัน
find $BACKUP_DIR -name "*.sql" -mtime +$RETAIN_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETAIN_DAYS -delete

echo "[$(date)] Backup completed: db_$TIMESTAMP.sql, uploads_$TIMESTAMP.tar.gz"
EOF

chmod +x /opt/dcms-backup.sh

# เพิ่มใน crontab (รัน 02:00 ทุกวัน)
sudo crontab -e
# 0 2 * * * /opt/dcms-backup.sh >> /var/log/dcms-backup.log 2>&1
```

### ตรวจสอบ Backup
```bash
# ดู backup files
ls -lh /backup/dcms/

# ทดสอบ restore จาก dump (บน server ทดสอบ เท่านั้น)
mysql -u damrongdham_user -p damrongdham_db_test < /backup/dcms/db_YYYYMMDD_HHMMSS.sql
```

---

## Restore — Database

### กรณีข้อมูลหาย / ต้อง rollback
```bash
# 1. หยุด App ก่อน (ป้องกัน write ระหว่าง restore)
docker compose -f /opt/damrongdham-ssk/docker-compose.prod.yml stop app

# 2. Restore จาก dump
docker exec -i damrongdham-db-prod \
  mysql -u damrongdham_user -p"<password>" damrongdham_db \
  < /backup/dcms/db_YYYYMMDD_HHMMSS.sql

# 3. ตรวจสอบข้อมูล
docker exec damrongdham-db-prod \
  mysql -u damrongdham_user -p"<password>" damrongdham_db \
  -e "SELECT COUNT(*) as total FROM complaints; SELECT MAX(created_at) as latest FROM complaints;"

# 4. Start App กลับ
docker compose -f /opt/damrongdham-ssk/docker-compose.prod.yml start app
```

### กรณี Volume หาย (disaster recovery)
```bash
# 1. สร้าง volume ใหม่ (จะสร้างอัตโนมัติตอน up ครั้งแรก)
docker compose -f /opt/damrongdham-ssk/docker-compose.prod.yml up -d db
# รอ healthcheck ผ่าน (ประมาณ 30-60 วินาที)

# 2. Restore schema + data
docker exec -i damrongdham-db-prod \
  mysql -u root -p"<root-password>" \
  < /backup/dcms/db_YYYYMMDD_HHMMSS.sql

# 3. Restore uploads
docker run --rm \
  -v app_uploads:/data \
  -v /backup/dcms:/backup \
  alpine tar xzf /backup/uploads_YYYYMMDD_HHMMSS.tar.gz -C /data

# 4. Start ทุก service
docker compose -f /opt/damrongdham-ssk/docker-compose.prod.yml up -d
```

---

## Backup — ไฟล์แนบ (Uploads)

```bash
# Manual backup uploads volume
docker run --rm \
  -v app_uploads:/data \
  -v /backup/dcms:/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .

# Restore uploads
docker run --rm \
  -v app_uploads:/data \
  -v /backup/dcms:/backup \
  alpine tar xzf /backup/uploads_YYYYMMDD.tar.gz -C /data
```

---

## Railway — Backup (Target A)

Railway ไม่มี built-in backup สำหรับ MySQL plugin ให้ทำ manual:

```bash
# ใช้ Railway CLI ดึง MySQL connection string
railway connect MySQL

# Dump ผ่าน connection ที่ได้
mysqldump -h <host> -P <port> -u <user> -p <dbname> > dcms_railway_backup.sql
```

แนะนำ: ตั้ง **Railway Cron Service** ที่รัน mysqldump แล้วอัปโหลดไป S3/GCS ทุกวัน

---

## Backup Policy แนะนำ

| ประเภท | ความถี่ | เก็บไว้กี่วัน | ที่เก็บ |
|--------|--------|------------|--------|
| Daily DB dump | ทุกวัน 02:00 | 30 วัน | `/backup/dcms/` |
| Weekly full | ทุกอาทิตย์ | 12 สัปดาห์ | External drive / S3 |
| Monthly archive | ทุกเดือน | 12 เดือน | External drive / S3 |
| .env files | ทุกครั้งที่แก้ | manual | Encrypted storage |
