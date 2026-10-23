import { fileToDataUrl, getConfiguration, updateConfiguration } from "../api.js";
import { pageUrl, renderAdminShell, showToast } from "./common.js";

if (renderAdminShell("Configurações")) {
  const form = document.querySelector("[data-settings-form]");
  const preview = document.querySelector("[data-logo-preview]");
  const fileInput = document.querySelector("[data-logo-file]");
  let logo = "";

  function renderLogo() {
    preview.innerHTML = logo ? `<img src="${logo}" alt="Pré-visualização do logótipo">` : "Sem logótipo personalizado";
  }

  function fill() {
    const configuration = getConfiguration();
    ["nomeOptica", "slogan", "telefone", "whatsapp", "facebook", "horarioTextual", "endereco", "latitude", "longitude"].forEach((key) => { form.elements[key].value = configuration[key] ?? ""; });
    logo = configuration.logo || "";
    renderLogo();
  }

  fileInput.addEventListener("change", async () => {
    try { logo = await fileToDataUrl(fileInput.files[0]); renderLogo(); }
    catch (error) { showToast(error.message, "error"); fileInput.value = ""; }
  });
  document.querySelector("[data-remove-logo]").addEventListener("click", () => { logo = ""; fileInput.value = ""; renderLogo(); });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.logo = logo || pageUrl("assets/images/logo/logo-transparente.png");
    try { updateConfiguration(data); showToast("Configurações guardadas e aplicadas ao website."); }
    catch (error) { showToast(error.message, "error"); }
  });
  fill();
}
