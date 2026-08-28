import jwt from 'jsonwebtoken';

export interface DeveloperTokenPayload {
  email: string;
  type: 'developer';
}

export const generateDeveloperToken = (email: string): string => {
  return jwt.sign(
    { email, type: 'developer' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const verifyDeveloperCredentials = (email: string, password: string): boolean => {
  const devEmail = process.env.DEVELOPER_EMAIL;
  const devPassword = process.env.DEVELOPER_PASSWORD;

  if (!devEmail || !devPassword) {
    return false;
  }

  return email === devEmail && password === devPassword;
};
