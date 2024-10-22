FROM node:20-alpine3.19 AS front-builder

WORKDIR /app/ui

COPY ui/package*.json ./

RUN npm install

COPY ui/ .

RUN npm run build

FROM golang:1.22-alpine AS builder

ARG TARGETPLATFORM

WORKDIR /app

COPY . .

RUN rm -rf ui/dist

COPY --from=front-builder /app/ui/dist /app/ui/dist

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg \
    \
    go mod download && \
    \
    if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        go build -o gogin ./cmd/main.go; \
    elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        GOARCH=arm64 go build -o gogin ./cmd/main.go; \
    elif [ "$TARGETPLATFORM" = "linux/arm/v7" ]; then \
        GOARCH=arm go build -o gogin ./cmd/main.go; \
    else \
        echo "Unsupported platform: $TARGETPLATFORM"; \
        exit 1; \
    fi

FROM scratch

WORKDIR /app

COPY --from=builder /app/certimate .

EXPOSE 8090

ENTRYPOINT ["./certimate", "serve", "--http", "0.0.0.0:8090"]
