FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --registry=https://registry.npmjs.org --replace-registry-host=always
COPY . .
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app?schema=public" npm run prisma:generate \
	&& npm run build \
	&& npm prune --omit=dev

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/views ./views
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]