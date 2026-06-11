FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci
RUN npm ci --prefix backend
RUN npm ci --prefix frontend

COPY . .

RUN cd backend && npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4111

EXPOSE 4111

CMD ["npm", "run", "start"]