docker cp ./scripts/dump.gz multiplayer-mongo:/tmp/dump.gz
docker exec -it multiplayer-mongo bash -c "mongorestore --archive=/tmp/dump.gz --gzip --drop --db=multiplayer"
