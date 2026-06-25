FROM node:22.16.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22.16.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server.js ./server.js
COPY src ./src
USER nodeapp
EXPOSE 5000
CMD ["node", "server.js"]
