import { createAppointment, getAvailableSlots, getConfiguration } from "./api.js";
import { showToast, telephoneUrl, whatsappUrl } from "./main.js";

const form = document.querySelector("[data-appointment-form]");
const dateInput = form.elements.data;
const timeSelect = form.elements.horario;
const configuration = getConfiguration();

function localToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

dateInput.min = localToday();
document.querySelector("[data-contact-address]").textContent = configuration.endereco;
const phone = document.querySelector("[data-contact-phone]");
phone.textContent = configuration.telefone;
phone.href = telephoneUrl(configuration.telefone);
document.querySelector("[data-contact-hours]").textContent = configuration.horarioTextual;
document.querySelector("[data-whatsapp-link]").href = whatsappUrl(configuration.whatsapp, "Olá. Gostaria de esclarecer uma dúvida sobre a marcação de consulta.");

function renderSlots() {
  const slots = getAvailableSlots(dateInput.value);
  timeSelect.disabled = !slots.length;
  timeSelect.innerHTML = slots.length ? `<option value="">Seleccione um horário</option>${slots.map((slot) => `<option value="${slot}">${slot}</option>`).join("")}` : `<option value="">Sem horários disponíveis</option>`;
}

function setError(field, message = "") {
  field.setAttribute("aria-invalid", message ? "true" : "false");
  document.querySelector(`[data-error-for="${field.name}"]`).textContent = message;
}

function validate() {
  let valid = true;
  [...form.elements].filter((field) => field.name).forEach((field) => setError(field));
  [...form.elements].filter((field) => field.required).forEach((field) => {
    if (!String(field.value).trim()) { setError(field, "Preencha este campo."); valid = false; }
  });
  if (dateInput.value && dateInput.value < localToday()) { setError(dateInput, "Seleccione uma data actual ou futura."); valid = false; }
  return valid;
}

dateInput.addEventListener("change", renderSlots);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) { showToast("Reveja os campos assinalados.", "error"); return; }
  try {
    const appointment = createAppointment(Object.fromEntries(new FormData(form)));
    form.hidden = true;
    const success = document.querySelector("[data-appointment-success]");
    success.hidden = false;
    success.querySelector("p").textContent = `A marcação para ${appointment.data}, às ${appointment.horario}, foi guardada e já está disponível no painel administrativo.`;
    success.focus?.();
  } catch (error) {
    showToast(error.message, "error");
    renderSlots();
  }
});

document.querySelector("[data-new-appointment]").addEventListener("click", () => {
  form.reset();
  timeSelect.innerHTML = '<option value="">Seleccione primeiro uma data</option>';
  timeSelect.disabled = true;
  form.hidden = false;
  document.querySelector("[data-appointment-success]").hidden = true;
  form.elements.nomeCompleto.focus();
});
