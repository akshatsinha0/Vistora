import { Sequelize } from 'sequelize';

// This will be set by index.ts after initialization
let sequelizeInstance: Sequelize | undefined;

export const setSequelizeInstance = (instance: Sequelize): void => {
  sequelizeInstance = instance;
};

export const getSequelizeInstance = (): Sequelize => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized');
  }
  return sequelizeInstance;
};

// Export a getter that returns the current instance
export const sequelize = new Proxy({} as Sequelize, {
  get(_target, prop) {
    if (!sequelizeInstance) {
      return undefined;
    }
    return (sequelizeInstance as any)[prop];
  },
});

export const connectDatabase = async (): Promise<void> => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized');
  }
  
  try {
    await sequelizeInstance.authenticate();
    console.log('Database connection established successfully');
    
    // Sync models after connection
    await sequelizeInstance.sync({ alter: true });
    console.log('Database models synchronized successfully');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

export const syncDatabase = async (force = false): Promise<void> => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized');
  }
  
  try {
    await sequelizeInstance.sync({ force });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database synchronization failed:', error);
    throw error;
  }
};
