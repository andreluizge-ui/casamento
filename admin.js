const LIMITE_CONVIDADOS = 80;
const { url: SUPABASE_URL, key: SUPABASE_KEY } = window.SUPABASE_CONFIG;
const elements = {
  confirmed: document.getElementById("confirmed-count"), declined: document.getElementById("declined-count"),
  remaining: document.getElementById("remaining-count"), responses: document.getElementById("response-count"),
  progress: document.getElementById("capacity-progress"), list: document.getElementById("guest-list"),
  empty: document.getElementById("empty-state"), search: document.getElementById("search"),
};

let respostas = [];
let filtroAtual = "Todos";
let codigoAcesso = sessionStorage.getItem("codigo-painel-casamento") || "";

async function buscarRespostas(codigo) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/listar_confirmacoes`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_codigo: codigo }),
  });
  if (!response.ok) throw new Error("Código inválido");
  return response.json();
}

function formatarData(valor) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
}

function escaparHtml(valor = "") {
  const div = document.createElement("div");
  div.textContent = valor;
  return div.innerHTML;
}

function atualizarResumo() {
  const confirmados = respostas.filter((item) => item.presenca === "Sim").length;
  const recusas = respostas.filter((item) => item.presenca === "Não").length;
  elements.confirmed.textContent = confirmados;
  elements.declined.textContent = recusas;
  elements.remaining.textContent = Math.max(0, LIMITE_CONVIDADOS - confirmados);
  elements.responses.textContent = respostas.length;
  elements.progress.style.width = `${Math.min(100, (confirmados / LIMITE_CONVIDADOS) * 100)}%`;
}

function renderizar() {
  const termo = elements.search.value.trim().toLocaleLowerCase("pt-BR");
  const filtradas = respostas
    .filter((item) => filtroAtual === "Todos" || item.presenca === filtroAtual)
    .filter((item) => item.nome.toLocaleLowerCase("pt-BR").includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  atualizarResumo();
  elements.list.innerHTML = filtradas.map((item) => `
    <tr>
      <td>${escaparHtml(item.nome)}</td>
      <td><span class="status ${item.presenca === "Sim" ? "yes" : "no"}">${item.presenca === "Sim" ? "Confirmado" : "Não irá"}</span></td>
      <td class="message-cell" title="${escaparHtml(item.mensagem || "")}">${escaparHtml(item.mensagem || "—")}</td>
      <td>${formatarData(item.atualizado_em || item.enviado_em)}</td>
    </tr>
  `).join("");
  elements.empty.classList.toggle("hidden", filtradas.length > 0);
}

async function entrarNoPainel(codigo) {
  respostas = await buscarRespostas(codigo);
  codigoAcesso = codigo;
  sessionStorage.setItem("codigo-painel-casamento", codigo);
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  renderizar();
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  const error = document.getElementById("login-error");
  button.disabled = true;
  error.classList.add("hidden");
  try {
    await entrarNoPainel(document.getElementById("access-code").value);
  } catch {
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
});

elements.search.addEventListener("input", renderizar);
document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    filtroAtual = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderizar();
  });
});

document.getElementById("export-button").addEventListener("click", () => {
  const protegerCelula = (valor = "") => `"${String(valor).replaceAll('"', '""')}"`;
  const linhas = [["Nome", "Resposta", "Mensagem", "Data"], ...respostas.map((item) => [item.nome, item.presenca, item.mensagem || "", formatarData(item.atualizado_em || item.enviado_em)])];
  const csv = "\uFEFF" + linhas.map((linha) => linha.map(protegerCelula).join(";")).join("\n");
  const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "lista-de-convidados-andre-e-giselly.csv";
  link.click();
  URL.revokeObjectURL(downloadUrl);
});

if (codigoAcesso) entrarNoPainel(codigoAcesso).catch(() => sessionStorage.removeItem("codigo-painel-casamento"));
