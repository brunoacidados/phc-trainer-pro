# Cutover final: aposentar o legado v5 e manter só o v6

Quando a plataforma v6 estiver estável e a equipa migrou (pilot concluído), fazer o cutover:

## Pré-condições
1. **Pilot concluído** — equipa a usar o v6 (`https://phc-trainer-pro-web.vercel.app`) sem issues críticos.
2. **Dados de utilizadores no v6** — quem usa o v5 tem conta no v6 (ou migrou via convite/onboarding).
3. **RAG semeada** (`pnpm rag:seed` executado) e emails a sair (SMTP/Resend configurados).
4. **Imagens** — opcional: gerar PNGs dos níveis (`docs/PROMPTS-IMAGENS.md`) e otimizar `og.png` (4MB → <1MB).

## Passos
1. **Desligar banner de migração** no legado: editar `migrate.json` → `{"enabled": false}` (ou remover o campo). Commit.
2. **Arquivar o legado**: mover ficheiros do legado v5 para `legacy/` (fora da raiz) para o GitHub Pages deixar de os servir:
   - `git mv index.html sw.js manifest.webmanifest legacy/` (+ `migrate.json`, assets do legado, se existirem).
   - Ajustar GitHub Pages (Settings → Pages) para apontar para `/docs` ou remover o Pages (o v6 vive em Vercel).
3. **Redirecionar (opcional)**: se alguém tinha bookmark do legado, colocar um `index.html` mínimo na raiz que redireciona para `https://phc-trainer-pro-web.vercel.app`.
4. **Tag de release**: `git tag v6.0.0 && git push --tags` (fim do alpha; v6 é a versão de produção).
5. **Comunicar**: avisar a equipa que o URL oficial é o Vercel; remover referências ao legado nos docs.

## Rollback (se necessário)
- O legado v5 fica em `legacy/` e em git history — pode ser reposto na raiz e o Pages reativado.
- O v6 web/api continua em Vercel/Render (não é afetado pelo cutover do Pages).

> **Nota:** o cutover é um passo de infraestrutura (GitHub Pages + Vercel) que deve ser feito por quem tem acesso aos settings do repositório/deploy. O script abaixo automatiza a parte de ficheiros.
