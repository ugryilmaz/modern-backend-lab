import authRepository from './auth.repository.js';
import { hashPassword, verifyPassword } from './password.js';

const register = async (email: string, password: string) => {
  const passwordHash = await hashPassword(password);
  const user = await authRepository.create(email, passwordHash);

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  return safeUser;
};

const login = async (email: string, password: string) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  return safeUser;
};

export { register, login };
