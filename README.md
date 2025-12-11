# Mejedo

> ⚠️ **Disclaimer:** This is my **Personal website** and **not intended for someone else to use**.  

Mejedo is my personal website inspired by the character futaba persona 5.

## Stuff it does
- View some info about me
- Look at my projects and shitposts
- Guestbook :D
- projects :0
- Spotify status ...
- Collections thing
- idk man im not locked in
## Docker Compose

```yaml
mejedo:
    image: ghcr.io/pucas01/mejedo:latest
    container_name: mejedo
    ports:
      - 3030:3000 

    volumes:
      - /your/path/medjed/config:/app/config 
      - /your/path/medjed/uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
    restart: unless-stopped