FROM node:20.19.0-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    procps \
    iputils-ping \
    net-tools \
    wget \
    build-essential \
    cmake \
    git \
    libjson-c-dev \
    libwebsockets-dev \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt ttyd
RUN git clone --depth=1 https://github.com/tsl0922/ttyd.git /tmp/ttyd && \
    cd /tmp/ttyd && \
    mkdir build && \
    cd build && \
    cmake .. && \
    make && \
    make install && \
    rm -rf /tmp/ttyd

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p public

ENV API_KEY_LIST="AIzaSyCSgJBwkD-FXVyw6WoGMLUNR_5TNHtbXEE|AIzaSyAW59ZAB3rLxdnHnr_XPyqsW5UqikJlgCY|AIzaSyDNqWpawtjZKJ-McdSJ8wy1FCfpcdiLhZA"
ENV BASE_MODEL="gemini-2.0-flash-lite"
ENV FLASH_MODEL="gemini-2.0-flash"
ENV PRO_MODEL="gemini-1.5-pro-latest"
ENV AUTH_TTS_LIST=""
ENV AUTH_TTS_V2_ACTION_NEXT="f6a37f3b9ffdb01ba2da16f264fdabab4a254f61"
ENV AUTH_TTS_V2_COOKIE="_ga=GA1.1.579373715.1744361415; _ga_R18J4BQM3E=GS1.1.1744361414.1.1.1744361439.0.0.0; Authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im5ndXllbmh1dXRhaS5yZXNldGVyQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoibmd1eWVuaHV1dGFpLnJlc2V0ZXJAZ21haWwuY29tIiwicGFzc3dvcmQiOiJuZ3V5ZW5odXV0YWkucmVzZXRlckBnbWFpbC5jb20iLCJpYXQiOjE3NDQzNjE0NDd9.d-5NWWFV0LIkwRCNv1ptLAcR8fGUlRGM8_Bmw9-j9tM"
ENV CURRENT_ENV=production
ENV APP_URL=https://genai.reseter.space
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

RUN echo '#!/bin/bash \n\
# Khởi động ttyd với xác thực \n\
echo "Khởi động ttyd với xác thực..." \n\
ttyd -p 8080 -t fontSize=14 -t theme={\"background\":\"#000000\"} --writable --credential admin:admin bash & \n\
\n\
# Khởi động Node.js \n\
echo "Đang khởi động ứng dụng Node.js..." \n\
node hosting.js \n\
' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000 8080

CMD ["/app/start.sh"] 