const LIMITE_CONVIDADOS = 80;
const { url: SUPABASE_URL, key: SUPABASE_KEY } = window.SUPABASE_CONFIG;
const elements = {
  confirmed: document.getElementById("confirmed-count"), declined: document.getElementById("declined-count"),
  remaining: document.getElementById("remaining-count"), responses: document.getElementById("response-count"),
  progress: document.getElementById("capacity-progress"), list: document.getElementById("guest-list"),
  empty: document.getElementById("empty-state"), search: document.getElementById("search"),
  familyForm: document.getElementById("family-form"), familyInput: document.getElementById("family-input"),
  familyList: document.getElementById("family-list"), familyEmpty: document.getElementById("family-empty"),
  familyFeedback: document.getElementById("family-feedback"),
};

let respostas = [];
let familias = [];
let filtroAtual = "Todos";

async function chamarRpc(funcao, parametros = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(parametros),
  });
  if (!response.ok) throw new Error(`Falha em ${funcao}`);
  if (response.status === 204) return null;
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
}

function linkDaFamilia(token) {
  return `${window.location.origin}${window.location.pathname.replace(/admin\.html$/, "")}?familia=${encodeURIComponent(token)}`;
}

function renderizarFamilias() {
  elements.familyList.innerHTML = familias
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((familia) => `
      <article class="family-item">
        <div><strong>${escaparHtml(familia.nome)}</strong><small>Link exclusivo da família</small></div>
        <div class="family-actions">
          <button class="copy-link-button" type="button" data-token="${familia.token}">Copiar link</button>
          <button class="remove-family-button" type="button" data-family-id="${familia.id}">Excluir</button>
        </div>
      </article>
    `).join("");
  elements.familyEmpty.classList.toggle("hidden", familias.length > 0);
}

async function buscarFamilias() {
  familias = await chamarRpc("listar_familias") || [];
  renderizarFamilias();
}

async function buscarRespostas() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/listar_confirmacoes`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_codigo: null }),
  });
  if (!response.ok) throw new Error("Não foi possível carregar as confirmações");
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
      <td data-label="Convidado">${escaparHtml(item.nome)}</td>
      <td data-label="Resposta"><span class="status ${item.presenca === "Sim" ? "yes" : "no"}">${item.presenca === "Sim" ? "Confirmado" : "Não irá"}</span></td>
      <td data-label="Mensagem" class="message-cell" title="${escaparHtml(item.mensagem || "")}">${escaparHtml(item.mensagem || "—")}</td>
      <td data-label="Data">${formatarData(item.atualizado_em || item.enviado_em)}</td>
      <td data-label="Ações" class="actions-cell"><button class="delete-button" type="button" data-id="${item.id}" aria-label="Excluir ${escaparHtml(item.nome)}">Excluir</button></td>
    </tr>
  `).join("");
  elements.empty.classList.toggle("hidden", filtradas.length > 0);
}

async function excluirConvidado(id) {
  const convidado = respostas.find((item) => item.id === id);
  if (!convidado || !window.confirm(`Excluir ${convidado.nome} da lista? Esta ação não pode ser desfeita.`)) return;

  const button = elements.list.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (button) {
    button.disabled = true;
    button.textContent = "Excluindo…";
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/excluir_confirmacao`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_id: id }),
    });
    if (!response.ok) throw new Error("Não foi possível excluir o convidado");
    respostas = respostas.filter((item) => item.id !== id);
    renderizar();
  } catch {
    if (button) {
      button.disabled = false;
      button.textContent = "Excluir";
    }
    window.alert("Não foi possível excluir o convidado. Tente novamente.");
  }
}

elements.list.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (button) excluirConvidado(button.dataset.id);
});

elements.familyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nome = elements.familyInput.value.trim();
  if (!nome) return;
  const button = elements.familyForm.querySelector("button");
  button.disabled = true;
  elements.familyFeedback.textContent = "";
  try {
    const dados = await chamarRpc("adicionar_familia", { p_nome: nome });
    const familia = Array.isArray(dados) ? dados[0] : dados;
    if (familia && !familias.some((item) => item.id === familia.id)) familias.push(familia);
    elements.familyInput.value = "";
    elements.familyFeedback.textContent = "Família adicionada. O link já pode ser copiado.";
    renderizarFamilias();
  } catch {
    elements.familyFeedback.textContent = "Não foi possível adicionar a família.";
  } finally {
    button.disabled = false;
  }
});

elements.familyList.addEventListener("click", async (event) => {
  const copyButton = event.target.closest(".copy-link-button");
  if (copyButton) {
    await navigator.clipboard.writeText(linkDaFamilia(copyButton.dataset.token));
    copyButton.textContent = "Link copiado!";
    setTimeout(() => { copyButton.textContent = "Copiar link"; }, 1800);
    return;
  }

  const removeButton = event.target.closest(".remove-family-button");
  if (!removeButton) return;
  const familia = familias.find((item) => item.id === removeButton.dataset.familyId);
  if (!familia || !window.confirm(`Excluir o link de ${familia.nome}?`)) return;
  removeButton.disabled = true;
  try {
    await chamarRpc("excluir_familia", { p_id: familia.id });
    familias = familias.filter((item) => item.id !== familia.id);
    renderizarFamilias();
  } catch {
    removeButton.disabled = false;
    window.alert("Não foi possível excluir este link.");
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

buscarRespostas()
  .then((dados) => {
    respostas = dados;
    renderizar();
  })
  .catch(() => {
    elements.empty.querySelector("h3").textContent = "Não foi possível carregar a lista";
    elements.empty.querySelector("p").textContent = "Atualize a página e tente novamente.";
  });

buscarFamilias().catch(() => {
  elements.familyFeedback.textContent = "Não foi possível carregar os links das famílias.";
});
