FROM node:20-alpine3.19 AS front-builder

WORKDIR /app/ui

COPY ui/package*.json ./

RUN npm install

COPY ui/ .

RUN npm run build

FROM golang:1.22-alpine AS builder

ARG TARGETPLATFORM

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN rm -rf ui/dist

COPY --from=front-builder /app/ui/dist /app/ui/dist

RUN --mount=type=cache,target=/root/.cache/go-build \
  --mount=type=cache,target=/go/pkg \
  case "$TARGETPLATFORM" in \
  "linux/amd64") go build -o certimate ;; \
  "linux/arm64") GOARCH=arm64 go build -o certimate ;; \
  "linux/arm/v7") GOARCH=arm go build -o certimate ;; \
  *) echo "Unsupported platform: $TARGETPLATFORM"; exit 1 ;; \
  esac

FROM scratch

WORKDIR /app

COPY --from=builder /app/certimate .

EXPOSE 8090

ENTRYPOINT ["./certimate", "serve", "--http", "0.0.0.0:8090"]
