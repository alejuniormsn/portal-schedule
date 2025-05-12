import { ModelStatic, Op } from "sequelize";
import {
  CustomError,
  handleDatabaseError,
} from "../shared/error/handleDatabaseError";
import resp from "../shared/messages/resp";
import RoOccurrenceTypeRel from "../database/models/ro/RoOccurrenceTypeRel";
import RoOccurrenceType from "../database/models/ro/RoOccurrenceType";
import RoOccurrenceRel from "../database/models/ro/RoOccurrenceRel";
import RoBusLineRel from "../database/models/ro/RoBusLineRel";
import RoStatusRel from "../database/models/ro/RoStatusRel";
import RoSectorRel from "../database/models/ro/RoSectorRel";
import BusLine from "../database/models/vehicle/BusLine";
import Vehicle from "../database/models/vehicle/Vehicle";
import RoCityRel from "../database/models/ro/RoCityRel";
import RoStatus from "../database/models/ro/RoStatus";
import RoCarRel from "../database/models/ro/RoCarRel";
import Ro from "../database/models/ro/Ro";
import User from "../database/models/User/User";
import RoUserRel from "../database/models/ro/RoUserRel";
import RoMotiveRel from "../database/models/ro/RoMotiveRel";
import RoDepartmentRel from "../database/models/ro/RoDepartmentRel";
import Department from "../database/models/shared/Department";
import RoAuditLog from "../database/models/ro/RoAuditLog";
import RoAuditLogRel from "../database/models/ro/RoAuditLogRel";

interface IRo {
  id?: number;
  occurrence_number: string;
  occurrence_date: string;
  created_at?: string;
  updated_at: string | null;
  date_restore: string | null;
  monitor_registration: number;
  ro_status: number;
  ro_occurrence_type: number;
  ro_car: number | null;
  vehicle_kilometer: number | null;
  ro_bus_line: number;
  employee_involved: number | null;
  ro_city: number;
  location: string;
  ro_sector: number;
  ro_occurrence: number;
  occurrence_detail: string | null;
  direction: number;
  sos: number | null;
  collected: number | null;
  substitution: number | null;
  deviation_realized: string | null;
  occurrence_response: string | null;
  observation: string | null;
  ro_user: number;
  ro_department: number;
  ro_motive: number;
  substitute_vehicle: number | null;
  departure_canceled_go_1: string | null;
  departure_canceled_go_2: string | null;
  departure_canceled_return_1: string | null;
  departure_canceled_return_2: string | null;
  interrupted_output: string | null;
  activeUserId: number;
  activeUser: string;
}

class RoService {
  private model: ModelStatic<Ro> = Ro;
  private modelRoAuditLog: ModelStatic<RoAuditLog> = RoAuditLog;

  async getAllRoSchedule() {
    try {
      const ro = await this.model.findAll({
        include: [
          { model: User, as: "ro_user" },
          { model: Vehicle, as: "ro_car" },
          { model: RoStatus, as: "ro_status", where: { id: { [Op.eq]: 1 } } },
          { model: BusLine, as: "ro_bus_line" },
          {
            model: RoOccurrenceType,
            as: "ro_occurrence_type",
            where: { id: { [Op.notIn]: [1, 3] } },
          },
          { model: Department, as: "ro_department" },
        ],
        order: [["created_at", "DESC"]],
      });
      if (!ro.length) {
        throw {
          status: 404,
          message: "R.O. not found",
        } as unknown as CustomError;
      }
      return resp(200, ro);
    } catch (error) {
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }

  async createRo(ro: IRo) {
    if (!this.model.sequelize) {
      throw new Error("Sequelize error");
    }
    const t = await this.model.sequelize.transaction();
    try {
      const createdRo = await this.model.create({ ...ro }, { transaction: t });
      const createdRoAuditLog = await this.modelRoAuditLog.create(
        {
          action: `Novo Registro de Ocorrência nº ${createdRo.occurrence_number}`,
          user_id: ro.activeUserId,
          user_name: ro.activeUser,
          ro_id: createdRo.id,
          created_at: createdRo.created_at,
        },
        { transaction: t }
      );
      await Promise.all([
        RoStatusRel.create(
          { ro_id: createdRo.id, ro_status_id: ro.ro_status },
          { transaction: t }
        ),
        RoOccurrenceTypeRel.create(
          {
            ro_id: createdRo.id,
            ro_occurrence_type_id: ro.ro_occurrence_type,
          },
          { transaction: t }
        ),
        ro.ro_car !== null
          ? RoCarRel.create(
              { ro_id: createdRo.id, ro_car_id: ro.ro_car },
              { transaction: t }
            )
          : Promise.resolve(),
        RoBusLineRel.create(
          { ro_id: createdRo.id, ro_bus_line_id: ro.ro_bus_line },
          { transaction: t }
        ),
        RoCityRel.create(
          { ro_id: createdRo.id, ro_city_id: ro.ro_city },
          { transaction: t }
        ),
        RoSectorRel.create(
          { ro_id: createdRo.id, ro_sector_id: ro.ro_sector },
          { transaction: t }
        ),
        RoOccurrenceRel.create(
          { ro_id: createdRo.id, ro_occurrence_id: ro.ro_occurrence },
          { transaction: t }
        ),
        RoUserRel.create(
          { ro_id: createdRo.id, ro_user_id: ro.ro_user },
          { transaction: t }
        ),
        RoMotiveRel.create(
          { ro_id: createdRo.id, ro_motive_id: ro.ro_motive },
          { transaction: t }
        ),
        RoDepartmentRel.create(
          { ro_id: createdRo.id, ro_department_id: ro.ro_department },
          { transaction: t }
        ),
        RoAuditLogRel.create(
          { ro_id: createdRo.id, ro_audit_id: createdRoAuditLog.id },
          { transaction: t }
        ),
      ]);
      await t.commit();
      return resp(200, createdRo);
    } catch (error: any) {
      await t.rollback();
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }
}

export default RoService;
