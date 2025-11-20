// In-memory user storage
const users = new Map();
let nextId = 1;

export const getUserById = (id) => {
  return users.get(id);
};

export const getUserByEmail = (email) => {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

export const getUserByUsername = (username) => {
  for (const user of users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return null;
};

export const getAllUsers = () => {
  return Array.from(users.values()).map(user => {
    // Don't return password hash
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
};

export const createUser = (userData) => {
  const id = nextId++;
  const user = {
    id,
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.set(id, user);
  return user;
};

export const updateUser = (id, updates) => {
  const user = users.get(id);
  if (!user) {
    return null;
  }
  
  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  users.set(id, updatedUser);
  return updatedUser;
};

export const deleteUser = (id) => {
  return users.delete(id);
};

