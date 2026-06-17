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
RUN apt-get update && \
    apt-get install -y chromium \
                       fonts-liberation \
                       libatk-bridge2.0-0 \
                       libatk1.0-0 \
                       libatspi2.0-0 \
                       libdrm2 \
                       libgbm1 \
                       libgtk-3-0 \
                       libnspr4 \
                       libnss3 \
                       libx11-xcb1 \
                       libxcomposite1 \
                       libxdamage1 \
                       libxfixes3 \
                       libxrandr2 \
                       xdg-utils && \
    rm -rf /var/lib/apt/lists/*


FROM node:${NODE_VERSION}-bookworm-slim AS runner
ARG SERVICE_VERSION
ENV SERVICE_VERSION=$SERVICE_VERSION
ARG SERVICE_FOLDER
ENV SERVICE_FOLDER=$SERVICE_FOLDER
WORKDIR /app/${SERVICE_FOLDER}

USER node
COPY --from=builder /app /app

EXPOSE 3000
CMD node ./dist/index.js
