import 'dotenv/config';
export const jwtConstants = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET,
};
