### Builder Stage
FROM node:lts-alpine AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm \
  && pnpm install \
  && pnpm store prune \
  && rm -rf /root/.npm /root/.pnpm-store

COPY . .
RUN pnpm run build

### Development Stage
FROM node:lts-alpine AS development
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY --from=builder /usr/src/app /usr/src/app
EXPOSE 8080
CMD ["pnpm", "run", "start:dev"]

### Production Stage
FROM node:lts-alpine AS production
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm \
  && pnpm install --prod \
  && pnpm store prune \
  && rm -rf /root/.npm /root/.pnpm-store
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 8080
CMD ["pnpm", "run", "start"]