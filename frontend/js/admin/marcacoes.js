import { getAppointments, updateAppointmentStatus } from "../api.js";
import { escapeHtml, openModal, renderAdminShell, showToast, statusBadge } from "./common.js";

if (renderAdminShell("Marcações")) {
  const table = document.querySelector("[data-appointments-table]");
  const empty = document.querySelector("[data-appointments-empty]");
  const filter = document.querySelector("#appointment-status-filter");
  const states = ["Pendente", "Confirmada", "Concluída", "Cancelada"];

  function render() {
    const appointments = getAppointments({ status: filter.value });
    empty.hidden = appointments.length > 0;
    table.innerHTML = appointments.map((appointment) => `<tr><td><strong>${escapeHtml(appointment.nomeCompleto)}</strong></td><td><a href="tel:${escapeHtml(appointment.contacto.replace(/\s/g, ""))}">${escapeHtml(appointment.contacto)}</a></td><td>${escapeHtml(appointment.tipoConsulta)}</td><td>${appointment.data}<br><span style="color:var(--cinza-medio)">${appointment.horario}</span></td><td>${statusBadge(appointment.estado)}</td><td><div class="table-actions"><button class="action-button" data-action="view" data-id="${appointment.id}">Detalhes</button><select class="action-button" data-action="status" data-id="${appointment.id}" aria-label="Alterar estado de ${escapeHtml(appointment.nomeCompleto)}">${states.map((state) => `<option ${state === appointment.estado ? "selected" : ""}>${state}</option>`).join("")}</select></div></td></tr>`).join("");
  }

  filter.addEventListener("change", render);
  table.addEventListener("change", (event) => {
    const select = event.target.closest('[data-action="status"]'); if (!select) return;
    try { updateAppointmentStatus(select.dataset.id, select.value); showToast("Estado da marcação actualizado."); render(); }
    catch (error) { showToast(error.message, "error"); render(); }
  });
  table.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="view"]'); if (!button) return;
    const appointment = getAppointments().find((item) => Number(item.id) === Number(button.dataset.id));
    openModal({ title: "Detalhes da marcação", submitLabel: "Fechar", body: `<div class="form-grid"><div><span class="field-label">Cliente</span><p>${escapeHtml(appointment.nomeCompleto)}</p></div><div><span class="field-label">Contacto</span><p>${escapeHtml(appointment.contacto)}</p></div><div><span class="field-label">Tipo</span><p>${escapeHtml(appointment.tipoConsulta)}</p></div><div><span class="field-label">Data e hora</span><p>${appointment.data} · ${appointment.horario}</p></div><div class="form-span-2"><span class="field-label">Estado</span><p>${statusBadge(appointment.estado)}</p></div><div class="form-span-2"><span class="field-label">Observações</span><p>${escapeHtml(appointment.observacoes || "Sem observações.")}</p></div></div>`, onSubmit: () => true });
  });
  render();
}
