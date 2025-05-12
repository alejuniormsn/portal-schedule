import { ModelStatic } from "sequelize";
import resp from "../shared/messages/resp";
import MaintenanceCar from "../database/models/maintenance_car/MaintenanceCar";
import MaintenanceType from "../database/models/maintenance_car/MaintenanceType";
import MaintenanceDetail from "../database/models/maintenance_car/MaintenanceDetail";
import MaintenanceStatus from "../database/models/maintenance_car/MaintenanceStatus";
import MaintenanceCarType from "../database/models/maintenance_car/MaintenanceCarType";
import MaintenanceCarDetail from "../database/models/maintenance_car/MaintenanceCarDetail";
import MaintenanceCarStatus from "../database/models/maintenance_car/MaintenanceCarStatus";
import {
  CustomError,
  handleDatabaseError,
} from "../shared/error/handleDatabaseError";

export interface IMaintenanceCar {
  id?: number;
  car: number;
  date_maintenance: Date;
  comments: string;
  types: number;
  details: number;
  status: number;
  registration_source: number;
  approver: number;
  created_at: Date;
  updated_at?: Date;
}

class MaintenanceCarService {
  private model: ModelStatic<MaintenanceCar> = MaintenanceCar;

  async getAllMaintenanceCarsSchedule() {
    try {
      const maintenanceCars = await this.model.findAll({
        include: [
          { model: MaintenanceType, as: "types" },
          { model: MaintenanceDetail, as: "details" },
          {
            model: MaintenanceStatus,
            as: "status",
            where: { id: 1 },
          },
        ],
        order: [
          ["created_at", "DESC"],
          ["car", "ASC"],
        ],
      });
      if (!maintenanceCars.length) {
        throw {
          status: 404,
          message: "Maintenance Cars not found",
        } as unknown as CustomError;
      }
      return resp(200, maintenanceCars);
    } catch (error) {
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }

  async createMaintenanceCar(maintenanceCar: IMaintenanceCar) {
    if (!this.model.sequelize) {
      throw new Error("Sequelize error");
    }
    const t = await this.model.sequelize.transaction();
    try {
      const createdMaintenanceCar = await this.model.create(
        { ...maintenanceCar },
        { transaction: t }
      );
      await Promise.all([
        MaintenanceCarType.create(
          {
            maintenance_car_id: createdMaintenanceCar.id,
            type_id: maintenanceCar.types,
          },
          { transaction: t }
        ),
        MaintenanceCarDetail.create(
          {
            maintenance_car_id: createdMaintenanceCar.id,
            detail_id: maintenanceCar.details,
          },
          { transaction: t }
        ),
        MaintenanceCarStatus.create(
          {
            maintenance_car_id: createdMaintenanceCar.id,
            status_id: maintenanceCar.status,
          },
          { transaction: t }
        ),
      ]);
      await t.commit();
      return resp(200, createdMaintenanceCar);
    } catch (error: any) {
      await t.rollback();
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }
}

export default MaintenanceCarService;
