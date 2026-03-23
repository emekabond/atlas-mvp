FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm run build

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.cjs"]
