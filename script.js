// Personalize aqui os dados principais do casamento.
const casamento = {
  noiva: "André",
  noivo: "Giselly",
  diaSemana: "Sábado",
  diaMes: "07 · 11",
  ano: "2026",
  dataCompleta: "7 de novembro de 2026",
  horario: "às 16h",
  local: "Espaço Dona Cora",
  endereco: "Rua Cristóvão Cavalcanti, 181 · Iputinga · Recife/PE",
  mapa: "https://www.google.com/maps/search/?api=1&query=Espa%C3%A7o+Dona+Cora%2C+Rua+Crist%C3%B3v%C3%A3o+Cavalcanti%2C+181%2C+Iputinga%2C+Recife%2C+PE",
  traje: "Esporte fino",
  prazoConfirmacao: "20 de setembro de 2026",
};

const campos = {
  "nome-noiva": casamento.noiva,
  "nome-noivo": casamento.noivo,
  "dia-semana": casamento.diaSemana,
  "dia-mes": casamento.diaMes,
  ano: casamento.ano,
  "data-completa": casamento.dataCompleta,
  horario: casamento.horario,
  local: casamento.local,
  endereco: casamento.endereco,
  traje: casamento.traje,
  prazo: casamento.prazoConfirmacao,
  "footer-date": `${casamento.diaMes.replace(" · ", " · ")} · ${casamento.ano}`,
};

Object.entries(campos).forEach(([id, valor]) => {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
});
document.getElementById("mapa-link").href = casamento.mapa;
document.title = `${casamento.noiva} & ${casamento.noivo} | Confirme sua presença`;

const form = document.getElementById("rsvp-form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const dados = Object.fromEntries(new FormData(form).entries());
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "Enviando...";

  try {
    const { url, key } = window.SUPABASE_CONFIG;
    const response = await fetch(`${url}/rest/v1/rpc/confirmar_presenca`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_nome: dados.nome, p_presenca: dados.presenca, p_mensagem: dados.mensagem || null }),
    });
    if (!response.ok) throw new Error("Falha no envio");

    document.getElementById("form-view").classList.add("hidden");
    document.getElementById("success-view").classList.remove("hidden");
    document.getElementById("success-title").textContent = dados.presenca === "Sim" ? `Que alegria, ${dados.nome.split(" ")[0]}!` : `Obrigado por responder, ${dados.nome.split(" ")[0]}.`;
    document.getElementById("success-message").textContent = dados.presenca === "Sim" ? "Sua presença foi confirmada. Estamos contando os dias para celebrar com você!" : "Sentiremos sua falta, mas agradecemos muito por nos avisar.";
    document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    alert("Não conseguimos enviar sua confirmação agora. Verifique sua internet e tente novamente.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});

document.getElementById("edit-response").addEventListener("click", () => {
  document.getElementById("success-view").classList.add("hidden");
  document.getElementById("form-view").classList.remove("hidden");
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((elemento) => observer.observe(elemento));
