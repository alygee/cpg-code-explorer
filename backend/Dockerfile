FROM node:20-alpine

WORKDIR /app

# Установка зависимостей для better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

