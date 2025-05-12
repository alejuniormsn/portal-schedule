import resp from "../shared/messages/resp";
import Sac from "../database/models/sac/Sac";
import Gender from "../database/models/User/Gender";
import Department from "../database/models/shared/Department";
import SacStatus from "../database/models/sac/SacStatus";
import SacSourceChannel from "../database/models/sac/SacSourceChannel";
import SacOccurrenceType from "../database/models/sac/SacOccurrenceType";
import SacGenderRel from "../database/models/sac/SacGenderRel";
import SacStatusRel from "../database/models/sac/SacStatusRel";
import SacDepartmentRel from "../database/models/sac/SacDepartmentRel";
import SacOccurrenceTypeRel from "../database/models/sac/SacOccurrenceTypeRel";
import SacSourceChannelRel from "../database/models/sac/SacSourceChannelRel";
import Priority from "../database/models/shared/Priority";
import SacPriorityRel from "../database/models/sac/SacPriorityRel";
import SacUserRel from "../database/models/sac/SacUserRel";
import User from "../database/models/User/User";
import { Op } from "sequelize";
import { ModelStatic } from "sequelize";
import {
  CustomError,
  handleDatabaseError,
} from "../shared/error/handleDatabaseError";

interface ISac {
  id: number;
  ticket_number: string;
  created_at: Date;
  updated_at?: Date;
  monitor_registration: number;
  sac_status: number;
  title: string;
  history: string;
  name_cli: string;
  phone?: string;
  email?: string;
  rg_cli?: string;
  sac_gender: number;
  sac_occurrence_type: number;
  sac_source_channel: number;
  sac_department: number;
  sac_priority: number;
  sac_user: number;
  sac_group: number;
  car: number;
  line_bus: number;
  related_ticket_list: string;
}

interface IFilter {
  search?: string | { [Op.like]: string };
  startedDate: string;
  endDate: string;
}

class SacService {
  private model: ModelStatic<Sac> = Sac;

  async getAllSacsSchedule(filter: IFilter) {
    const whereConditions = {
      ...(filter.search != "0" && {
        ticket_number: { [Op.like]: `%${filter.search}` },
      }),
      ...((filter.startedDate != "0" ||
        filter.endDate != "0" ||
        filter.search != "0") && {
        created_at: {
          [Op.between]: [
            filter.startedDate != "0" ? filter.startedDate : 0,
            filter.endDate != "0"
              ? filter.endDate
              : new Date().setHours(20, 59, 59, 999),
          ],
        },
      }),
    };
    const whereInclude = {
      ...(filter.search == "0" &&
        filter.startedDate == "0" &&
        filter.endDate == "0" && { id: { [Op.ne]: 3 } }),
    };
    try {
      const sacs = await this.model.findAll({
        where: whereConditions,
        include: [
          {
            model: SacStatus,
            as: "sac_status",
            where: whereInclude,
          },
          { model: Gender, as: "sac_gender" },
          { model: SacOccurrenceType, as: "sac_occurrence_type" },
          { model: SacSourceChannel, as: "sac_source_channel" },
          { model: Department, as: "sac_department" },
          { model: Priority, as: "sac_priority" },
          { model: User, as: "sac_user" },
        ],
        order:
          filter.search != "0" ||
          filter.startedDate !== "0" ||
          filter.endDate !== "0"
            ? ["created_at"]
            : ["updated_at"],
      });
      if (!sacs.length) {
        throw {
          status: 404,
          message: "Sac not found",
        } as unknown as CustomError;
      }
      return resp(200, sacs);
    } catch (error) {
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }

  async createdSac(sac: ISac) {
    if (!this.model.sequelize) {
      throw new Error("Sequelize error");
    }
    const t = await this.model.sequelize.transaction();
    try {
      const createdSac = await this.model.create(
        { ...sac },
        { transaction: t }
      );
      await Promise.all([
        SacStatusRel.create(
          { sac_id: createdSac.id, sac_status_id: sac.sac_status },
          { transaction: t }
        ),
        SacGenderRel.create(
          { sac_id: createdSac.id, sac_gender_id: sac.sac_gender },
          { transaction: t }
        ),
        SacOccurrenceTypeRel.create(
          {
            sac_id: createdSac.id,
            sac_occurrence_type_id: sac.sac_occurrence_type,
          },
          { transaction: t }
        ),
        SacSourceChannelRel.create(
          {
            sac_id: createdSac.id,
            sac_source_channel_id: sac.sac_source_channel,
          },
          { transaction: t }
        ),
        SacDepartmentRel.create(
          { sac_id: createdSac.id, sac_department_id: sac.sac_department },
          { transaction: t }
        ),
        SacPriorityRel.create(
          { sac_id: createdSac.id, sac_priority_id: sac.sac_priority },
          { transaction: t }
        ),
        SacUserRel.create(
          { sac_id: createdSac.id, sac_user_id: sac.sac_user },
          { transaction: t }
        ),
      ]);
      await t.commit();
      return resp(200, createdSac);
    } catch (error: any) {
      await t.rollback();
      const erro = handleDatabaseError(error);
      throw resp(erro.status, erro.message);
    }
  }
}

export default SacService;
