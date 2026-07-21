# syntax=docker/dockerfile:1

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --no-scripts --prefer-dist
COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache \
        libpq \
        libzip \
        icu-libs \
        oniguruma \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        postgresql-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql mbstring bcmath zip intl opcache \
    && apk del .build-deps

RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.memory_consumption=192'; \
    } > /usr/local/etc/php/conf.d/opcache-prod.ini

WORKDIR /var/www/html
COPY --from=vendor /app /var/www/html

RUN addgroup -g 1000 www && adduser -G www -u 1000 -D www \
    && chown -R www:www /var/www/html/storage /var/www/html/bootstrap/cache

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER www
EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
