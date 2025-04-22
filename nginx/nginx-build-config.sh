#!/bin/bash

# Nginx v1.27.5

./configure \
    --with-zlib=../zlib-1.3.1 \
    --with-pcre=../pcre2-10.43 \
    --with-openssl=../openssl-3.0.13 \
    --prefix=/var/www/html \
    --sbin-path=/usr/sbin/nginx \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/lock/nginx.lock \
    --conf-path=/etc/nginx/nginx.conf \
    --http-log-path=/var/log/nginx/access.log \
    --error-log-path=/var/log/nginx/error.log \
    --with-threads \
    --with-http_v2_module \
    --with-http_v3_module \
    --with-stream=dynamic \
    --with-http_ssl_module \
    --with-http_gzip_static_module