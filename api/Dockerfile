FROM node:18-alpine AS builder
WORKDIR /usr/src/app
# copy package files first to leverage caching
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
# build TypeScript
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
# copy runtime files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
# install only production deps
RUN npm install --only=production
ENV PORT=8000
EXPOSE 8000
CMD ["node", "dist/index.js"]

