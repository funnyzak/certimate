FROM node:20-alpine3.19 AS front-builder

WORKDIR /app

COPY . /app/

RUN \
  cd /app/ui && \
  npm install && \
  npm run build

FROM golang:1.22-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

COPY ../. /app/

RUN rm -rf /app/ui/dist

COPY --from=front-builder /app/ui/dist /app/ui/dist

RUN --mount=type=cache,target=/root/.cache/go-build \
  --mount=type=cache,target=/go/pkg \
  \
  go mod download && \
  \
  if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
  go build -o certimate; \
  elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
  GOARCH=arm64 go build -o certimate; \
  elif [ "$TARGETPLATFORM" = "linux/arm/v7" ]; then \
  GOARCH=arm go build -o certimate; \
  else \
  echo "Unsupported platform: $TARGETPLATFORM"; \
  exit 1; \
  fi

FROM scratch

WORKDIR /app

COPY --from=builder /app/certimate .

EXPOSE 8090

ENTRYPOINT ["./certimate", "serve", "--http", "0.0.0.0:8090"]
