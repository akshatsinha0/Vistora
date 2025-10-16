import { sequelize } from '../config/database';
import { initUserModel } from './User';
import { initTaskModel } from './Task';

export function initializeModels(): void {
  initUserModel(sequelize);
  initTaskModel(sequelize);
}
