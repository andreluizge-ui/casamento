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

## Recebimento das respostas

O formulário está conectado ao Supabase. As respostas são centralizadas no banco de dados e podem ser consultadas em `admin.html` usando o código privado dos noivos.
