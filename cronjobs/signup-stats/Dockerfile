ARG NODE_VERSION=24.13.1

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
RUN corepack enable
RUN npm i -g turbo



FROM base AS prepare
ARG SERVICE_FOLDER
WORKDIR /app
COPY . .
RUN PACKAGE_NAME=$(node -p "require('./${SERVICE_FOLDER}/package.json').name") \
  && turbo prune $PACKAGE_NAME --docker



FROM base AS builder
ARG SERVICE_FOLDER
WORKDIR /app
COPY --from=prepare /app/out/json/ .
RUN  --mount=type=cache,id=pnpm,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
COPY --from=prepare /app/out/full/ .
RUN --mount=type=cache,id=turbo,target=/app/.turbo turbo build



FROM node:${NODE_VERSION}-bookworm-slim AS runner
ARG SERVICE_VERSION
ENV SERVICE_VERSION=$SERVICE_VERSION
ARG SERVICE_FOLDER
ENV SERVICE_FOLDER=$SERVICE_FOLDER
WORKDIR /app
USER node
COPY --from=builder /app .

EXPOSE 3000
CMD node ${SERVICE_FOLDER}/dist/index.js
