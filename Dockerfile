FROM node:18

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the frontend (creates dist/)
RUN npm run build

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start the server (uses server/index.ts that serves dist/)
CMD ["npm", "start"]
