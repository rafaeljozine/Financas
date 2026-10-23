const SESSION_KEY = "opticaExcelente.adminSession";
const DEMO_EMAIL = "admin@opticaexcelente.co.mz";
const DEMO_PASSWORD_HASH = "044d659909c48893a2cb7d5d0bff412e5c4ae194c0f0d7bfe15e80049283802f";

async function hashText(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function login(email, password) {
  const validEmail = String(email).trim().toLocaleLowerCase() === DEMO_EMAIL;
  const validPassword = await hashText(String(password));
  if (!validEmail || validPassword !== DEMO_PASSWORD_HASH) throw new Error("Email ou palavra-passe incorrectos.");
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: DEMO_EMAIL, authenticatedAt: new Date().toISOString() }));
  return true;
}

export function isAuthenticated() {
  try { return Boolean(JSON.parse(sessionStorage.getItem(SESSION_KEY))?.email); }
  catch { return false; }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace(new URL("../../pages/admin/login.html", import.meta.url).href);
    return false;
  }
  return true;
}

export function initLoginPage() {
  if (isAuthenticated()) {
    window.location.replace(new URL("../../pages/admin/dashboard.html", import.meta.url).href);
    return;
  }
  const form = document.querySelector("[data-login-form]");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.querySelector("[data-login-error]");
    const button = form.querySelector('button[type="submit"]');
    error.textContent = "";
    button.disabled = true;
    button.textContent = "A entrar…";
    try {
      await login(form.elements.email.value, form.elements.password.value);
      window.location.replace(new URL("../../pages/admin/dashboard.html", import.meta.url).href);
    } catch (loginError) {
      error.textContent = loginError.message;
      form.elements.password.focus();
      button.disabled = false;
      button.textContent = "Entrar no painel";
    }
  });
}

if (document.querySelector("[data-login-form]")) initLoginPage();
