# scripts/backup.sh
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --username $MONGO_USERNAME --password $MONGO_PASSWORD \
  --authenticationDatabase admin --archive > $BACKUP_DIR/backup_$DATE.archive

# Compress
gzip $BACKUP_DIR/backup_$DATE.archive

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.archive.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.archive.gz"