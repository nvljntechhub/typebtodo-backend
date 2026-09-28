FROM node:24-bookworm-slim AS development
WORKDIR /usr/src/app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
EXPOSE 5001
CMD ["npm", "run", "start:dev"]

FROM node:24-bookworm-slim AS build
WORKDIR /usr/src/app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build && npm ci --omit=dev

FROM node:24-bookworm-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./
EXPOSE 5001
CMD ["node", "dist/main.js"]