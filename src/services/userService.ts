import { ModelStatic } from "sequelize";
import User from "../database/models/User/User";
import resp from "../shared/messages/resp";
import AccessGroup from "../database/models/shared/AccessGroup";
import Department from "../database/models/shared/Department";
import {
  CustomError,
  handleDatabaseError,
} from "../shared/error/handleDatabaseError";

interface IUser {
  id?: number;
  registration: number;
  cpf: string;
  name: string;
  email: string;
  motherName: string;
  occurrence?: string;
  phone: string;
  password: string;
  access_group: number;
  last_modified_by?: number;
  department: Array<number>;
  name_main_department: string;
  access_level: Array<JSON>;
  created_at: Date;
  updated_at?: Date;
}

export interface IUserSchedule {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private model: ModelStatic<User> = User;

  async getUserSchedule(id: number) {
    try {
      const user: IUserSchedule | null = await this.model.findOne({
        where: { id: id },
        attributes: { exclude: ["password"] },
      });
      if (!user || user === null) {
        throw {
          status: 404,
          message: "User not found",
        } as unknown as CustomError;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      throw Error(`User id ${id} not found in scheduleJob`);
    }
  }

  async register(user: IUser) {
    if (!this.model.sequelize) {
      throw new Error("Sequelize error");
    }
    const t = await this.model.sequelize.transaction();
    try {
      const createdUser = await this.model.create(
        { ...user },
        { transaction: t }
      );
      await t.commit();
      return resp(201, createdUser);
    } catch (error: any) {
      await t.rollback();
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }
}

export default UserService;
