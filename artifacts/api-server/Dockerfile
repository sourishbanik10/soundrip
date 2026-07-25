FROM node:20-slim

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip ca-certificates && \
    pip3 install yt-dlp --break-system-packages || pip3 install yt-dlp && \
    npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

EXPOSE 3001

CMD ["pnpm","--filter","@workspace/api-server","start"]
