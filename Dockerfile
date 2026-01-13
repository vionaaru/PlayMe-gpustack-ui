# stage 1: build UI
FROM node:20-alpine AS ui
WORKDIR /app
RUN corepack enable

# кешируем зависимости
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# потом исходники
COPY . .
RUN pnpm build

# stage 2: gpustack + custom UI
FROM gpustack/gpustack:v2.0.3
COPY --from=ui /app/dist/ /usr/local/lib/python3.11/dist-packages/gpustack/ui/
