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
