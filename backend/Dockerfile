FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=4111
EXPOSE 4111

CMD ["npm", "run", "start"]
