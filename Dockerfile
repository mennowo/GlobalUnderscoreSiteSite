FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010

# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# runtime needs the server code, built client, and a writable data dir
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3010
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3010/me >/dev/null || exit 1

CMD ["node", "server/index.js"]
