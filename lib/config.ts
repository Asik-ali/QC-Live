// Hardcoded configuration as fallback when env vars don't load
export const config = {
  auth: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD_HASH || '$2a$10$c5.lcFhm0dyoiWf0f8sRce8cO03/YbyWn/X5E/qCnecPKTKclOHye',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dr)P6&/Bi$.tW->lY5of+x0d!3yE^(qo',
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './public/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '2147483648'),
  },
  database: {
    path: process.env.DATABASE_PATH || './data/streams.db',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Personal Streaming App',
    port: parseInt(process.env.PORT || '3000'),
  },
};