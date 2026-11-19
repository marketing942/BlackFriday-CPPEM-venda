# Backup da página de venda (antes do modo "oferta encerrada")

Cópia fiel de `index.html`, `styles.css`, `script.js`, `exit-popup.*` e `vercel.json`
como estavam no commit `5da7362` (oferta aberta, fim em 19/11 23h59).
Também marcado com a tag git `backup-pre-encerramento`.

Para restaurar a versão antiga: copie os arquivos desta pasta para a raiz do repositório
(`cp backup-antes-encerramento/* .` e apague o LEIA-ME.md da raiz), ou
`git checkout backup-pre-encerramento -- index.html styles.css script.js`.
Os assets (`assets/`) não mudaram.
