ARG NODE_VERSION=24.13.1

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
RUN corepack enable
RUN npm i -g turbo



FROM base AS prepare
WORKDIR /app
COPY . .
RUN turbo prune @multiplayer/multiplayer-web-app --docker



FROM base AS runner
WORKDIR /app
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
COPY --from=prepare /app/out/full/ .
RUN turbo build --filter="!@multiplayer/multiplayer-web-app"
ENV BROWSER=none
WORKDIR /app/clients/multiplayer-web-app
EXPOSE 3000
CMD ["npm", "start"]
