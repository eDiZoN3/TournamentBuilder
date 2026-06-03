/**
 * PM2 ecosystem config (minimal)
 * - Replace placeholders in env_production with real secrets or set them via your host's env settings.
 * - Do NOT commit real credentials.
 */

module.exports = {
  apps: [
    {
      name: "raro",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      },
      env_production: {
        // Replace these placeholders in your deployment environment (do not commit real secrets)
        MONGODB_URI: "mongodb+srv://<user>:<pass>@cluster.example.net/raro",
        NEXTAUTH_URL: "https://your-public-host.example",
        NEXTAUTH_SECRET: "<long-random-secret>",
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "ChangeMe"
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      error_file: "./logs/raro-error.log",
      out_file: "./logs/raro-out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
