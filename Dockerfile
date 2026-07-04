# Stage 1: Build the React static frontend assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --only=production

# Copy build assets from stage 1
COPY --from=builder /app/dist ./dist
# Copy API files and Express server
COPY --from=builder /app/api ./api
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# Install tsx globally to run TypeScript files directly in production
RUN npm install -g tsx

EXPOSE 3000
CMD ["tsx", "server.ts"]
