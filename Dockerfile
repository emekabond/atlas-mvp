FROM node:18

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the frontend + server bundle (creates dist/)
RUN npm run build

# Let Railway provide PORT, just document what we expose
ENV NODE_ENV=production
EXPOSE 8080

# Start the server (uses server/index.ts that serves dist/)
CMD ["npm", "start"]
