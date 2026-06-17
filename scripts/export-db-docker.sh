docker exec -it multiplayer-mongo bash -c "mongodump --db=multiplayer --gzip --archive > /tmp/dump.gz"
docker cp multiplayer-mongo:/tmp/dump.gz ./scripts/dump.gz
