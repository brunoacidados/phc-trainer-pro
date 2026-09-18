# 🧠 PHC Trainer Pro — como usar

Plataforma de **formação prática** para o módulo Gestão do Cegid PHC Evolution/CS Desktop.

**🌐 Site:** https://brunoacidados.github.io/phc-trainer-pro/ (instale como app pelo ícone ⊕ do navegador — funciona offline após a 1ª visita)

## Ficheiros

| Ficheiro                                     | O que é                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **index.html**                               | A aplicação completa (missões, tutor IA, mascote, dicionário, circuitos, cartas, testes, evidências, progresso) |
| **assets/flashcards-phc.csv**                | O mesmo baralho de 126 cartas para o Anki (separador `;`)                                                       |
| **docs/guia-expert-phc-gestao-evolution.md** | A teoria completa (15 capítulos) — também embutida na aba 📚 Teoria                                             |

## Comece agora (nesta ordem)

1. **📜 Protocolo** — leia as regras do treino (regra 0: **conceito antes da prática**).
2. **🏢 Empresa** — escolha o seu segmento de treino (12 opções realistas portuguesas: hotelaria, eletrónica, distribuição, construção, clínica…) ou faça a **entrevista de 3 passos** e deixe a IA gerar o seu **curso personalizado**. Todas as missões, aulas e exemplos passam a usar a SUA empresa.
3. Prepare o ambiente com as missões **L00–L05** (pastas, SQL Server, instalação do PHC, backups, acessos, Dicionário de Dados).
4. Siga a aba **🎯 Jornada** diariamente: ela mostra apenas o essencial — a **missão atual** (botão ▶ Iniciar passo a passo = Modo Foco: um passo por vez com voz e IA), as **revisões vencidas**, as **cartas do dia** e a **meta de 5 ações**.
   - As missões são **liberadas uma a uma** (modo guiado). Quer tudo destrancado (consulta/formação de equipa)? ⚙️ Definições → desative a sequência guiada.
   - Navegação simplificada: 📚 Aprender junta Circuitos + Dicionário + Guia + Protocolo; 🧠 Praticar junta Cartas + Testes; 📊 Progresso junta Visão + Provas + Conquistas + Equipa.
5. Em cada missão: leia o **📖 Conceito** (carrossel) → **▶ Passo a passo** (Modo Foco) ou ficha completa → se quiser, **🎓 Aula guiada** (parágrafo a parágrafo, com voz) → evidências.
6. Ao terminar: **✅ Registar repetição** — a missão volta em 1, 2, 4, 7, 14, 30 e 60 dias. A partir da 3ª vez, **cronometre** (meta 🏁). Dominou? **🧠 Sei de cor**.
7. O nível avança com **todas** as missões 🧠 + teste ≥ 80%.
8. **Especializações:** packs **Contabilidade (L57–L66)**, **Pessoal/Vencimentos (L67–L74)**, **POS & Retalho (L75–L82)** e **Suporte/Pós-venda (L83–L89)** — mesma empresa de treino, como num cliente real. As 24 🏅 conquistas registam os marcos (aba Progresso).
9. **🌍 Contexto:** na aba 🏢 Empresa escolha o **país** (PT/ES/AO/MZ/CV/PE — ficha fiscal de cada um) e a **gama** (Corporate/Advanced/Enterprise). As missões mostram avisos de requisitos e o Professor adapta as explicações ao contexto.
10. **👥 Equipa (formadores/parceiros):** cada técnico exporta a sua ficha em Progresso → Equipa; importe as fichas para comparar a equipa e exportar CSV.

## 🤖 Tutor IA e voz

- **Professor Einstein** (mascote no canto inferior direito): pisca, fala (TTS pt-BR) e dá dicas por aba. **Clique** para abrir o chat de IA.
- **⚙️ Definições**: cole a sua chave OpenRouter (fica só no seu navegador) ou abra uma vez o seu link pessoal `…/#aik=SUA_CHAVE`; escolha modelo, voz on/off, velocidade, **modo econômico** (sem IA: leitura do texto original), limpar cache, exportar/importar/apagar progresso.
- **🔊 Voz (⚙️ Definições → Voz do Professor):** provedor recomendado **🇧🇷 Gemini TTS** — voz feminina brasileira natural (Sulafat ⭐, Kore, Leda…). Crie uma chave grátis em aistudio.google.com → API Keys e cole nas Definições, ou abra uma vez o link `…/#gmk=SUA_CHAVE` (fica só no seu navegador; áudio em cache local). Alternativas: Navegador (use Edge + voz ⭐ Natural), ElevenLabs (chave própria) e Groq (experimental, só inglês). Se a voz cloud falhar, cai automaticamente na voz do navegador.
- As explicações ficam em **cache**: cada parágrafo só consome créditos uma vez. Defina limite de créditos no painel do OpenRouter.

## 📕 Enciclopédia (novo na v4.3)

A aba **📕 Enciclopédia** traz o conhecimento da Enciclopédia PHC oficial destilado: 154 funções internas, 77 funções Xbase, dicas, erros comuns, artigos técnicos e o índice do manual completo (3.076 tópicos). Use a **pesquisa global** (cruza todas as secções), o 🔊 para ouvir e o 🧠 para o Professor explicar qualquer entrada com exemplos da sua empresa. As missões mostram **chips 📕** que saltam direto para o tema na Enciclopédia. (Descrições resumidas/reescritas com atribuição à Cegid/PHC — o original continua no CHM/Help Center oficial.)

## 🤖 Auto-Router de IA (v5.0) — nunca fique sem créditos

As chamadas de IA passam por 6 fornecedores em ordem (⚙️ Definições → Tutor IA): **Groq → Gemini → Mistral → Cerebras → NVIDIA → OpenRouter**. Se um falhar (sem créditos/limite/rede), o app **troca sozinho** para o seguinte mantendo a mesma persona e contexto. Botão **"Testar todos"** mostra o estado de cada um. A **voz é sempre Gemini** (feminina pt-BR). Abra o seu link pessoal com todas as chaves uma vez por navegador (fragmentos `#aik=…&gmk=…&grk=…&mst=…&cbs=…&nvi=…`).

## 🌐 Proxy Cloudflare (opcional)

Quer usar a **NVIDIA (glm-5.3)** diretamente no navegador? A API deles não tem CORS — o repositório traz um Worker grátis de 5 minutos (`worker/README.md`): deploy na Cloudflare, segredo `NVIDIA_KEY`, cole o URL do Worker em ⚙️ Definições → 🌐 Proxy → Testar. A NVIDIA sobe para 3.º no auto-router e as chaves ficam seguras no Worker.

## 🧰 Gerador de Código PHC (novo)

Em **📚 Aprender → 🧰 Gerador de código**: escolha o artefato (evento Xbase, regra, valor por defeito, análise SQL, script web C#…), descreva o problema e receba **onde configurar + código pronto + como testar + cuidados**, com as funções reais da Enciclopédia injetadas no prompt. Teste sempre em BD clonada e veja a Análise Interna após colar.

## 🔎 Descoberta guiada + confiança real (novo na v5.3.0)

No **🧰 Gerador**, descreva apenas o pedido (ex.: "quero ver os últimos 10 registos na ft e as tabelas relacionadas"). A IA mostra uma **fila pendente de validação** e a **confiança real (0–100 %)**, e a app gera um **script de descoberta sob medida** (inclui a tabela interna **dic**, colunas, campos `u_*`, FKs, linhas de amostra, stored procedures, views e jobs). Corra-o no Simulador de SQL/SSMS e **cole os resultados**: a IA reavalia a fila até atingir **≥99 % de confiança** e só então entrega o código final. Cada colagem fica acumulada em "📐 O meu esquema" — a app aprende a sua BD. As **12 regras de SQL do seu responsável técnico** continuam aplicadas a todo o SQL, e a geração de código usa **GLM-5.3 com prioridade** (via proxy).

## 📸 Evidências

Convenção de ficheiros: `C:\PHC-Treino\evidencias\L<nn>\AAAA-MM-DD-<descricao>.png` — e registe cada prova na aba **📸 Provas** (exportável em CSV). Sem evidência, não aconteceu.

## Avisos

- Treine numa **empresa demo/clonada**, nunca na base de dados de produção de um cliente.
- O progresso é guardado **por navegador/origem** — use ⚙️ → Exportar/Importar para migrar entre dispositivos.
- Nomes de menus/ecrãs seguem o software (PT-PT); confirme detalhes na sua versão/gama no Help Center in-app.

Bons estudos — e lembre-se: **sem evidência, não há aprendizado.**
