FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

FROM alpine:3.20
RUN apk add --no-cache caddy
WORKDIR /srv
COPY --from=build /app/dist/chatims-frontend/browser /srv
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/Caddyfile /etc/caddy/Caddyfile
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
