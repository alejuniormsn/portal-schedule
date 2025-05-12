import { scheduleJob } from "node-schedule";
import { isPending, isOld } from "../shared/workingWithDates";
import sendMail from "../services/api/sendMail";
import SacService from "../services/sacService";
import payloadSendEmailX9 from "../shared/messages/sendMailX9";
import logError from "../shared/error/logger";
import RoService from "../services/roService";
import UserService, { IUserSchedule } from "../services/userService";
import MaintenanceCarService from "../services/maintenanceCarService";
import MonitoringCarServiceSchedule from "../services/monitoringCarService";

const serviceSac = new SacService();
const serviceRo = new RoService();
const serviceUser = new UserService();
const serviceMaintenanceCar = new MaintenanceCarService();
const serviceMonitoringCar = new MonitoringCarServiceSchedule();

const IVAN = 27;
const WILLIAM = 48;
const OLIVEIRA = 30;
const BOCCHIO = 11;
const ADMIN = 1;

const schedule = scheduleJob("00 00 08 * * 1-5", async () => {
  try {
    const { message }: any = await serviceRo.getAllRoSchedule();
    const resultFilter = message.filter((e: any) => {
      if (isOld(e.created_at.toISOString(), 3)) return e;
    });
    if (Array.isArray(resultFilter) && resultFilter.length === 0) {
      throw new Error("RO Not Found in scheduleJob");
    }
    const user: IUserSchedule = await serviceUser.getUserSchedule(WILLIAM);
    const payload = payloadSendEmailX9([user], "RO", resultFilter);
    await sendMail(payload);
  } catch (error: any) {
    logError(`ScheduleJob - RO module is faulty `, error.message);
  }
});

const schedule2 = scheduleJob("10 00 08 * * 1-5", async () => {
  try {
    const { message }: any =
      await serviceMaintenanceCar.getAllMaintenanceCarsSchedule();
    const resultFilter = message.filter((e: any) => {
      if (isPending(e.created_at.toISOString(), 1)) return e;
    });
    if (Array.isArray(resultFilter) && resultFilter.length === 0)
      throw new Error("MaintenanceCars Not Found in scheduleJob");
    const user: IUserSchedule = await serviceUser.getUserSchedule(OLIVEIRA);
    const payload = payloadSendEmailX9([user], "MANUTENÇÃO", resultFilter);
    await sendMail(payload);
  } catch (error: any) {
    logError(`ScheduleJob - MaintenanceCars module is faulty: `, error.message);
  }
});

const schedule3 = scheduleJob("20 00 08 * * 1-5", async () => {
  try {
    const { message }: any = await serviceSac.getAllSacsSchedule({
      search: "0",
      startedDate: "0",
      endDate: "0",
    });
    const resultFilter = message.filter((e: any) => {
      if (isOld(e.updated_at.toISOString(), 3)) return e;
    });
    if (Array.isArray(resultFilter) && resultFilter.length === 0) {
      throw new Error("Sac Not Found in scheduleJob");
    }
    const user: IUserSchedule = await serviceUser.getUserSchedule(IVAN);
    const payload = payloadSendEmailX9([user], "SAC", resultFilter);
    await sendMail(payload);
  } catch (error: any) {
    logError(`ScheduleJob - Sac module is faulty: `, error.message);
  }
});

const schedule4 = scheduleJob("00 00 12 * * 1-5", async () => {
  try {
    const { message }: any =
      await serviceMonitoringCar.getAllMonitoringCarSchedule();
    const resultFilter = message.filter((e: any) => {
      if (isOld(e.date_check.toISOString(), 3)) return e;
    });
    if (Array.isArray(resultFilter) && resultFilter.length === 0) {
      throw new Error("Monitoring Cars Not Found in scheduleJob");
    }
    const user: IUserSchedule = await serviceUser.getUserSchedule(BOCCHIO);
    const payload = payloadSendEmailX9([user], "MONITORAMENTO", resultFilter);
    await sendMail(payload);
  } catch (error: any) {
    logError(`ScheduleJob - Monitoring Cars module is faulty `, error.message);
  }
});

export default { schedule, schedule2, schedule3, schedule4 };

//const job = schedule.scheduleJob("05 15 10 * * 1-5", () => {});
// Expressão Cron
// 05: Segundo em que a tarefa deve ser executada.
// 15: Minuto em que a tarefa deve ser executada.
// 10: Hora em que a tarefa deve ser executada (15:00 ou 3 PM).
// *: Qualquer dia do mês.
// *: Qualquer mês.
// 1-5: Segunda a Sexta-feira (* para qualquer dia da semana)
