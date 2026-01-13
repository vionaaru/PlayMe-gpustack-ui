# stage 1: build UI
FROM node:20-alpine AS ui
WORKDIR /app

RUN corepack enable
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

# stage 2: gpustack + custom UI
FROM gpustack/gpustack:v2.0.3
COPY --from=ui /app/dist/ /usr/local/lib/python3.11/dist-packages/gpustack/ui/
