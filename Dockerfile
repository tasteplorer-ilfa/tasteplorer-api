# I just set up only on development process, currently no need setup docker for production since we only do deploying to vercel function :)
FROM node:alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm run build