import { defineRailway, github, mysql, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const MySQL = mysql("MySQL", { region: "us-west2" });
  MySQL.deploy = { startCommand: "docker-entrypoint.sh mysqld --innodb-use-native-aio=0 --disable-log-bin --performance_schema=0 --innodb-buffer-pool-size=1G" };
  MySQL.networking = { privateNetworkEndpoint: "mysql" };
  const mysqlVolume = volume("mysql-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-west2", sizeMB: 500 });
  const SimpleBookingMUA = service("SimpleBookingMUA", {
    source: github("AzerothGT/SimpleBookingMUA", { checkSuites: false, rootDirectory: "/backend-mua" }),
    replicas: { "us-west2": 1 },
    deploy: { sleepApplication: true },
    networking: { privateNetworkEndpoint: "simplebookingmua" },
    env: { APP_DEBUG: preserve(), APP_ENV: preserve(), APP_FAKER_LOCALE: preserve(), APP_FALLBACK_LOCALE: preserve(), APP_KEY: preserve(), APP_LOCALE: preserve(), APP_MAINTENANCE_DRIVER: preserve(), APP_NAME: preserve(), APP_URL: preserve(), BCRYPT_ROUNDS: preserve(), BROADCAST_CONNECTION: preserve(), CACHE_STORE: preserve(), CORS_ALLOWED_ORIGINS: preserve(), DB_CONNECTION: preserve(), DB_DATABASE: preserve(), DB_HOST: preserve(), DB_PASSWORD: preserve(), DB_PORT: preserve(), DB_USERNAME: preserve(), FILESYSTEM_DISK: preserve(), L5_SWAGGER_GENERATE_ALWAYS: preserve(), LOG_CHANNEL: preserve(), LOG_LEVEL: preserve(), MAIL_FROM_ADDRESS: preserve(), MAIL_FROM_NAME: preserve(), MAIL_MAILER: preserve(), MIDTRANS_SERVER_KEY: preserve(), MIDTRANS_SNAP_URL: preserve(), QUEUE_CONNECTION: preserve(), SESSION_DOMAIN: preserve(), SESSION_DRIVER: preserve(), SESSION_ENCRYPT: preserve(), SESSION_LIFETIME: preserve(), SESSION_PATH: preserve(), SESSION_SECURE_COOKIE: preserve(), VITE_APP_NAME: preserve() },
  });
  const miniwallet = service("miniwallet", {
    source: github("AzerothGT/miniwallet", { checkSuites: false, rootDirectory: "/miniwallet-be" }),
    replicas: { "us-west2": 1 },
    deploy: { sleepApplication: true, startCommand: "php artisan serve --host=0.0.0.0 --port=$PORT" },
    env: { APP_DEBUG: preserve(), APP_ENV: preserve(), APP_KEY: preserve(), APP_URL: preserve(), AUTH_COOKIE_SAME_SITE: preserve(), AUTH_COOKIE_SECURE: preserve(), CACHE_STORE: preserve(), DB_CONNECTION: preserve(), DB_DATABASE: preserve(), DB_HOST: preserve(), DB_PASSWORD: preserve(), DB_PORT: preserve(), DB_USERNAME: preserve(), FILESYSTEM_DISK: preserve(), FRONTEND_URL: preserve(), LOG_CHANNEL: preserve(), LOG_LEVEL: preserve(), LOG_STDERR_FORMATTER: preserve(), MAIL_MAILER: preserve(), QUEUE_CONNECTION: preserve(), SANCTUM_STATEFUL_DOMAINS: preserve(), SESSION_DRIVER: preserve() },
  });

  return project("disciplined-solace", {
    resources: [MySQL, SimpleBookingMUA, miniwallet, mysqlVolume],
  });
});
