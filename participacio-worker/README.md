# API de participació — Puig i Cadafalch

Backend opcional basat en Cloudflare Workers + D1. Fins que no es desplegui, el web públic **no pot** acumular vots de diversos visitants.

## Activació

1. Instal·la Node.js i obre un terminal a aquesta carpeta.
2. Executa `npx wrangler login`.
3. Executa `npx wrangler d1 create puig-cadafalch-participacio`.
4. Copia el `database_id` retornat a `wrangler.jsonc` (substitueix `SUBSTITUEIX_PEL_DATABASE_ID`).
5. Executa `npx wrangler d1 migrations apply puig-cadafalch-participacio --remote`.
6. Per rebre també notificacions de les propostes des de l'API, executa `npx wrangler secret put WEB3FORMS_KEY` i enganxa la teva clau de Web3Forms; no la desis al repositori.
7. Executa `npx wrangler deploy`. Copia l'adreça HTTPS del Worker.
8. Al fitxer `index.html` de l'arrel, canvia la constant `PARTICIPACIO_API_URL` per l'adreça del Worker (sense barra final) i publica el commit a GitHub Pages.
9. Comprova `https://EL_TEU_WORKER.workers.dev/api/estat`. Prova dos navegadors diferents: el total de vots ha de coincidir. Envia una proposta de prova i comprova Web3Forms i la base de dades.

## Disseny i límits

- GET /api/vots retorna els recomptes reals (tots comencen a zero).
- POST /api/vots amb `{"voter":"UUID-del-navegador","opcio":"mapa"}` registra/substitueix una preferència. Dedupe per navegador: no és resistent a manipulacions amb identitats falses.
- POST /api/propostes desa el comentari a D1 i prova d'enviar la notificació amb Web3Forms. La resposta diferencia `stored` i `notified`.
- La web existent manté Web3Forms com a alternativa mentre l'API no estigui activada.
- D1 conté dades personals quan l'usuari facilita nom o correu. Cal informar de la seva gestió i definir conservació/accés segons el marc de privacitat aplicable. No facis pública la base de dades.
