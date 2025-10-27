# Mejedo

> ⚠️ **Disclaimer:** This is my **Personal website** and **not intended for someone else to use**.  

Mejedo is my personal website inspired by the character futaba persona 5.

## Stuff it does
- View some info about me
- Look at my projects and shitposts
- Guestbook :D
## Docker Compose

```yaml
services:
  mejedo:
    image: ghcr.io/pucas01/mejedo:latest
    container_name: mejedo
    ports:
      - 80:3000
    volumes:
      - ./suitchi/config:/app/backend/config
    environment:
      - NODE_ENV=production
    restart: unless-stopped