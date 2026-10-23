import { getConfiguration } from "./api.js";
import { telephoneUrl, whatsappUrl } from "./main.js";

const configuration = getConfiguration();
document.querySelector("[data-location-address]").textContent = configuration.endereco;
const phone = document.querySelector("[data-location-phone]");
phone.textContent = configuration.telefone;
phone.href = telephoneUrl(configuration.telefone);
document.querySelector("[data-location-hours]").textContent = configuration.horarioTextual;
document.querySelector("[data-location-whatsapp]").href = whatsappUrl(configuration.whatsapp, "Olá. Gostaria de visitar a Óptica Excelente E.I.");
const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${configuration.latitude},${configuration.longitude}`)}`;
document.querySelector("[data-directions-link]").href = directions;
document.querySelector("[data-location-map]").src = `https://www.google.com/maps?q=${encodeURIComponent(`${configuration.latitude},${configuration.longitude}`)}&z=16&output=embed`;
const facebookRow = document.querySelector("[data-facebook-row]");
if (configuration.facebook) document.querySelector("[data-location-facebook]").href = configuration.facebook;
else facebookRow.hidden = true;
