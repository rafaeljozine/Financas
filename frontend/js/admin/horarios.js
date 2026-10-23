import { getSchedules, updateSchedules } from "../api.js";
import { renderAdminShell, showToast } from "./common.js";

if (renderAdminShell("Horários")) {
  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const grid = document.querySelector("[data-schedule-grid]");
  const schedules = getSchedules();
  grid.innerHTML = schedules.map((schedule) => `<div class="schedule-row" data-day="${schedule.diaSemana}"><strong class="schedule-day">${dayNames[schedule.diaSemana]}</strong><label class="check-field"><input name="ativo" type="checkbox" ${schedule.ativo ? "checked" : ""}> Activo</label><div class="form-field"><label>Abertura</label><input name="abertura" type="time" value="${schedule.abertura}"></div><div class="form-field"><label>Encerramento</label><input name="encerramento" type="time" value="${schedule.encerramento}"></div><div class="form-field"><label>Duração (min.)</label><input name="duracaoConsulta" type="number" min="15" step="15" value="${schedule.duracaoConsulta}"></div></div>`).join("");
  document.querySelector("[data-schedules-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = [...grid.querySelectorAll("[data-day]")].map((row) => ({ diaSemana: Number(row.dataset.day), ativo: row.querySelector('[name="ativo"]').checked, abertura: row.querySelector('[name="abertura"]').value, encerramento: row.querySelector('[name="encerramento"]').value, duracaoConsulta: Number(row.querySelector('[name="duracaoConsulta"]').value) }));
    try { updateSchedules(data); showToast("Horários guardados. A página pública já utiliza esta configuração."); }
    catch (error) { showToast(error.message, "error"); }
  });
}
