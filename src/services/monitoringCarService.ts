import { ModelStatic, Op } from "sequelize";
import MonitoringCar from "../database/models/monitoring_car/MonitoringCar";
import MonitoringOccurrence from "../database/models/monitoring_car/MonitoringOccurrence";
import MonitoringCarOccurrence from "../database/models/monitoring_car/MonitoringCarOccurrence";
import MonitoringOccurrenceTypes from "../database/models/monitoring_car/MonitoringOccurrenceTypes";
import MonitoringStatus from "../database/models/monitoring_car/MonitoringStatus";
import {
  CustomError,
  handleDatabaseError,
} from "../shared/error/handleDatabaseError";
import resp from "../shared/messages/resp";
import MonitoringCarOccurrenceTypes from "../database/models/monitoring_car/MonitoringCarOccurrenceTypes";
import MonitoringCarStatus from "../database/models/monitoring_car/MonitoringCarStatus";

interface IMonitoringCar {
  id?: number;
  monitor_registration: number;
  date_check: Date;
  car: number;
  driver_registration: number;
  date_occurrence: Date;
  ra_globus: string;
  video_path?: string;
  comment?: string;
  treatment?: string;
  type_occurrence: number;
  occurrence: number;
  monitoring_status: number;
  date_inspector?: Date;
  inspector_registration?: number;
  created_at: Date;
  updated_at?: Date;
}

class MonitoringCarServiceSchedule {
  private model: ModelStatic<MonitoringCar> = MonitoringCar;

  async getAllMonitoringCarSchedule() {
    try {
      const monitoringCars = await this.model.findAll({
        include: [
          { model: MonitoringOccurrenceTypes, as: "type_occurrence" },
          { model: MonitoringOccurrence, as: "occurrence" },
          {
            model: MonitoringStatus,
            as: "monitoring_status",
            where: { id: { [Op.lt]: 3 } }, // menor que 3 (Finalizado)
          },
        ],
        order: [
          ["date_check", "DESC"],
          ["car", "ASC"],
        ],
      });
      if (!monitoringCars.length) {
        throw {
          status: 404,
          message: "Monitoring not found",
        } as unknown as CustomError;
      }
      return resp(200, monitoringCars);
    } catch (error) {
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }

  async createdMonitoringCar(monitoringCar: IMonitoringCar) {
    if (!this.model.sequelize) {
      throw new Error("Sequelize error");
    }
    const t = await this.model.sequelize.transaction();
    try {
      const createdMonitoringCar = await this.model.create(
        { ...monitoringCar },
        { transaction: t }
      );
      await Promise.all([
        MonitoringCarOccurrence.create(
          {
            monitoring_car_id: createdMonitoringCar.id,
            monitoring_occurrence_id: monitoringCar.occurrence,
          },
          { transaction: t }
        ),
        MonitoringCarOccurrenceTypes.create(
          {
            monitoring_car_id: createdMonitoringCar.id,
            monitoring_occurrence_type_id: monitoringCar.type_occurrence,
          },
          { transaction: t }
        ),
        MonitoringCarStatus.create(
          {
            monitoring_car_id: createdMonitoringCar.id,
            monitoring_status_id: monitoringCar.monitoring_status,
          },
          { transaction: t }
        ),
      ]);
      await t.commit();
      return resp(200, createdMonitoringCar);
    } catch (error: any) {
      await t.rollback();
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }
}

export default MonitoringCarServiceSchedule;
