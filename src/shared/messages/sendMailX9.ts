import { IUserSchedule } from "../../services/userService";
import greeting from "../greeting";
import { keepStrWithHour } from "../workingWithDates";

type Select = {
  id: number;
  name: string;
};

type SacSchedule = {
  id: number;
  ticket_number: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  sac_status: Select[];
  sac_occurrence_type: Select[];
  sac_user: Select[];
};

type MaintenanceCarsSchedule = {
  id: number;
  car: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  types: Select[];
  status: Select[];
  registration_source: string;
};

type MonitoringCarSchedule = {
  id: number;
  car: string;
  title: string;
  date_check: Date;
  updated_at: Date;
  occurrence: Select[];
  monitoring_status: Select[];
  monitor_registration: string;
};

type RoSchedule = {
  id: number;
  occurrence_number: string;
  ro_user: Select[];
  created_at: Date;
  updated_at: Date;
  ro_status: Select[];
  ro_occurrence_type: Select[];
};

type TypeSchedule = {
  id: number;
  doc_number: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  occurrence: string;
  user: string;
};

const payloadSendEmailX9 = (
  user: IUserSchedule[],
  moduleName: string,
  data: any[]
) => {
  let result: TypeSchedule[] = [];
  if (moduleName === "SAC") {
    const dataSac = data as SacSchedule[];
    result = dataSac.map((e) => {
      return {
        id: e.id,
        doc_number: e.ticket_number,
        title: e.title,
        created_at: e.created_at,
        updated_at: e.updated_at,
        status: e.sac_status[0].name,
        occurrence: e.sac_occurrence_type[0].name,
        user: e.sac_user[0].name,
      };
    });
  }
  if (moduleName === "RO") {
    const dataRO = data as RoSchedule[];
    result = dataRO.map((e) => {
      return {
        id: e.id,
        doc_number: e.occurrence_number,
        title: "R.O. - Registro de Ocorrência Operacional",
        created_at: e.created_at,
        updated_at: e.updated_at,
        status: e.ro_status[0].name,
        occurrence: e.ro_occurrence_type[0].name,
        user: e.ro_user[0].name,
      };
    });
  }
  if (moduleName === "MANUTENÇÃO") {
    const dataMaintenanceCars = data as MaintenanceCarsSchedule[];
    result = dataMaintenanceCars.map((e) => {
      return {
        id: e.id,
        doc_number: `Carro ${e.car}`,
        title: "Pedido de Veículos",
        created_at: e.created_at,
        updated_at: e.updated_at,
        occurrence: e.types[0].name,
        status: e.status[0].name,
        user: e.registration_source,
      };
    });
  }
  if (moduleName === "MONITORAMENTO") {
    const dataMonitoringCar = data as MonitoringCarSchedule[];
    result = dataMonitoringCar.map((e) => {
      return {
        id: e.id,
        doc_number: `Carro ${e.car}`,
        title: "Monitoramento",
        created_at: e.date_check,
        updated_at: e.updated_at,
        occurrence: e.occurrence[0].name,
        status: e.monitoring_status[0].name,
        user: e.monitor_registration,
      };
    });
  }
  return {
    to: user.map((e) => e.email.toLowerCase()),
    subject: `RELATÓRIO DE PENDÊNCIAS DO PORTAL ADM DA ETT`,
    text: `Olá ${user.map((e) => e.name).join(", ")}, ${greeting()},\n
Conforme acordado, segue relatório de pendências do Portal ADM com prazos de resolução acima do esperado:\n
------------------------------------------------------------------------
MÓDULO ${moduleName}\n
${result
  .map(
    (e) =>
      ` Número do documento: ${e.doc_number}
  Título: ${e.title}
  Data de Abertura: ${keepStrWithHour(e.created_at.toISOString())}
  Data da Última Alteração: ${
    e.updated_at
      ? keepStrWithHour(e.updated_at.toISOString())
      : "não houve alteração"
  }
  Ocorrência: ${e.occurrence}  -  Status: ${e.status}
  Responsável: ${e.user}
  ------------------------------------------------------------------------\n`
  )
  .join("")}
\nVocê pode visualizar estes chamados e acompanhar o seu progresso através do Portal ADM ETT buscando pelo o módulo correspondente.
Caso não reconheça estas informações, pedimos que informe ao departamento de suporte técnico.
Nunca informe seus dados de acesso para outras pessoas.
Este é um e-mail automático de uso do Portal ADM ETT.
NÃO utilize-o para RESPONDER !`,
    html: `<p>Olá ${user.map((e) => e.name).join(", ")}, ${greeting()},</p>
          <p>Conforme acordado, segue relatório de pendências do Portal ADM com prazos de resolução acima do esperado:</p>
          <p>MÓDULO ${moduleName}</p>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr>
              <th>Número do Documento</th>
              <th>Título</th>
              <th>Data de Abertura</th>
              <th>Data da Última Alteração</th>
              <th>Ocorrência</th>
              <th>Status</th>
              <th>Responsável</th>
            </tr>
            ${result
              .map(
                (e) => `
                <tr>
                  <td>${e.doc_number}</td>
                  <td>${e.title}</td>
                  <td>${keepStrWithHour(e.created_at.toISOString())}</td>
                  <td>${
                    e.updated_at
                      ? keepStrWithHour(e.updated_at.toISOString())
                      : "não houve alteração"
                  }</td>
                  <td>${e.occurrence}</td>
                  <td>${e.status}</td>
                  <td>${e.user}</td>
                </tr>
              `
              )
              .join("")}
          </table>
          <br>
          <p>Você pode visualizar estes chamados e acompanhar o seu progresso através do Portal ADM ETT buscando pelo o módulo correspondente.</p>
          <p>Caso não reconheça estas informações, pedimos que informe ao departamento de suporte técnico.</p>
          <p>Nunca informe seus dados de acesso para outras pessoas.</p>
          <p>Este é um e-mail automático de uso do Portal ADM ETT.</p>
          <p>NÃO utilize-o para RESPONDER !</p>`,
  };
};

export default payloadSendEmailX9;
