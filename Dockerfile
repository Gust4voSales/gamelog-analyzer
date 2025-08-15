FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Clean up dev dependencies
RUN npm ci --only=production && npm cache clean --force

# Create directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE ${PORT}

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
