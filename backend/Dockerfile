FROM php:8.4-fpm-alpine AS runtime
RUN apk add --no-cache curl libcurl libpq libxml2 oniguruma \
 && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS curl-dev libpq-dev libxml2-dev linux-headers oniguruma-dev \
 && docker-php-ext-install curl dom mbstring opcache pdo_pgsql \
 && pecl install excimer \
 && docker-php-ext-enable excimer \
 && echo "zend.exception_ignore_args=Off" > /usr/local/etc/php/conf.d/99-sentry.ini \
 && apk del .build-deps

FROM runtime AS vendor
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction \
 && composer check-platform-reqs --no-dev

FROM runtime
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache
RUN php artisan package:discover --ansi
RUN chmod -R a+rX app bootstrap config public routes \
 && chmod a+r artisan composer.json composer.lock \
 && true
USER www-data
CMD ["php-fpm"]
