import userRepository from './user.repository.js';

const getUsers = async () => {
  return userRepository.findAll();
};

const createUser = async (
  name: string,
  email: string,
  passwordHash: string,
) => {
  return userRepository.create(name, email, passwordHash);
};

const getUserById = async (id: number) => {
  const user = await userRepository.findById(id);

  if (!user) {
    return null;
  }

  return user;
};

const updateUser = async (
  id: number,
  data: {
    name?: string;
    email?: string;
  },
) => {
  const user = await userRepository.update(id, data);

  if (!user) {
    return null;
  }

  return user;
};

const deleteUser = async (id: number) => {
  const user = await userRepository.remove(id);

  if (!user) {
    return null;
  }

  return user;
};

export default {
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  createUser,
};
