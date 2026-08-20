# Site de confirmação de presença

Página estática e responsiva para RSVP de casamento.

O arquivo `admin.html` contém o painel dos noivos, com o total de confirmações, recusas, vagas restantes (limite de 80), busca, filtros e exportação em CSV.

## Personalização

Abra `script.js` e altere o objeto `casamento` no início do arquivo. Ali ficam os nomes, data, horário, endereço, traje, prazo e link do mapa.

## Ver localmente

Basta abrir `index.html` no navegador. Para usar um servidor local:

```powershell
python -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## Importante: recebimento das respostas

Nesta versão, as confirmações ficam salvas no navegador do próprio convidado (`localStorage`), o que serve para demonstração, mas não envia os dados aos noivos.

Para publicar e receber respostas de verdade, conecte o formulário a um serviço como Formspree, Google Forms/Sheets, Netlify Forms ou a uma API própria. No `script.js`, substitua o trecho de `localStorage` dentro do evento `submit` por uma requisição `fetch` ao serviço escolhido.
