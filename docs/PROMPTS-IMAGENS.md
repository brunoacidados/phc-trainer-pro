# 🎨 Prompts de Imagens — PHC Trainer Pro

Gera estas imagens nas tuas versões **pro/ilimitadas** (Gemini / GPT) e guarda cada uma com **EXATAMENTE** o nome de ficheiro indicado, em:

```
apps/web/public/img/guia/<nome>.png
```

> A app já procura primeiro o `.png`; enquanto não existir, mostra o `.svg` de reserva.
> Ou seja: **assim que colocares o PNG com o nome certo, ele aparece sozinho no momento certo** (hero da missão + miniatura do nível). Não precisas de mudar código.

**Formato:** PNG, paisagem ~16:9 (mín. 1280×720).
**Estilo-base (repete em todos para coerência):** fotografia-realista de ecrã / screenshot de alta fidelidade de um software ERP de secretária (estilo Cegid PHC CS/Evolution), interface **clara (light theme)** com acentos laranja `#f5a623`, textos e rótulos em **português de Portugal**, tipografia nítida tipo Segoe UI, janelas com sombras suaves, sem marcas de água, sem logótipos reais de terceiros, sem pessoas.

---

## lvl0.png — Ambiente & SQL Server

Screenshot realista de secretária com duas janelas lado a lado: à esquerda o **SQL Server Management Studio** com a árvore de bases de dados (instância `SQLEXPRESS`, base `TREINO_MODELO`) e uma grelha de resultados de query; à direita um **assistente de instalação do ERP** titulado "Instalação PHC — Gestão" com barra de progresso a ~70% e o caminho de destino `C:\PHC-Treino`. Barra de tarefas Windows discreta em baixo. Luz de escritório suave, ecolhã realista de monitor.

## lvl1.png — Ficha de Cliente

Screenshot realista do ecrã **"Ficheiros → Clientes"** de um ERP: à esquerda uma lista/grelha de clientes; à direita a **ficha de cliente** com campos preenchidos em português — Nome "Cliente Modelo, Lda", NIF "500 000 000", Morada, Zona "Lisboa", Condição de pagamento "30 dias", separadores (Geral, Moradas, Contatos). Botões "Gravar"/"Fechar" com acento laranja.

## lvl2.png — Faturação (Fatura com QR/ATCUD)

Screenshot realista do ecrã de **faturação**: grelha de linhas de documento (Artigo, Qtd, Preço, IVA), painel de totais à direita (Total líquido, IVA 23%, **Total a negrito**), e no rodapé do documento um **QR code** e o código **ATCUD**. Série "FT 2026/001". Botão "Emitir" laranja. Aspeto de documento fiscal português credível.

## lvl3.png — Compras & Stocks

Screenshot realista de **compras/armazém**: no topo uma encomenda a fornecedor ("Fornecedor: Ibertrónica, S.A.", Nº doc "EC 2026/001"); em baixo uma grelha de stocks com colunas Artigo, Armazém, Stock, Mín, Máx, PCMP, com algumas células de stock mínimo a vermelho-suave. Ícone de armazém discreto.

## lvl4.png — Financeiro / Tesouraria

Screenshot realista de um **painel de tesouraria**: três cartões KPI no topo ("Saldo banco 12.400€", "A receber 8.100€", "A pagar 3.200€") e em baixo um gráfico de barras/barras horizontais de movimentos bancários + lista de recibos. Tons claros com destaques laranja e verde-suave.

## lvl5.png — Fiscal / SAF-T (AT)

Screenshot realista de um ecrã de **conformidade fiscal**: painel "Comunicação à AT / e-Fatura" com estado "Enviado ✔", lista de documentos comunicados, e um documento com **QR code + ATCUD**; referência a "SAF-T (PT)" e período "2026/09". Aspeto oficial/credível, sem logótipos reais da AT.

## lvl6.png — Análises & Dashboards

Screenshot realista de um **dashboard de análises**: KPIs ("Vendas mês 42.000€", "Margem 31%", "Top cliente: Hotel Baía Azul"), um gráfico de linhas de vendas mensais e um gráfico de barras por família de artigos. Filtros no topo (período, loja). Visual limpo de BI embutido no ERP.

## lvl7.png — Framework / Eventos & Código

Screenshot realista de um **editor de código** integrado no ERP (tema escuro só na zona de código) com código Xbase/Visual FoxPro comentado em português (linhas com `ObjRecebido`, `Return .F.`), e à direita um painel claro "Eventos de utilizador" com a lista de eventos e botão "Testar". Contraste entre editor escuro e painéis claros.

## lvl8.png — Projeto / Implementação completa

Screenshot realista de um **painel de projeto/checklist**: lista de missões/fases com caixas de verificação marcadas (56/56), barra de progresso 100%, contadores "Evidências 120", "Testes 13/13", e um selo/distintivo discreto de conclusão. Aspeto de gestor de projetos dentro do ERP.

## lvl9.png — Contabilidade / Lançamentos

Screenshot realista de um ecrã de **lançamento contabilístico**: cabeçalho com Conta "21.01.01", Débito/Crédito "1.250,00", Documento "FT 2026/1", Período "2026/09", Histórico "Fatura cliente"; grelha de linhas de lançamento equilibradas (débito=crédito) e botão "Lançar". Visual de contabilidade portuguesa.

## lvl10.png — Pessoal / Vencimentos

Screenshot realista de um ecrã de **processamento salarial**: ficha de funcionário ("Ana Silva", Categoria "Técnica"), linhas de vencimento (Venc. base 1.400,00€, Subsídio de alimentação, Descontos SS 11%, **Líquido 1.102,00€**) e um recibo de vencimento ao lado. Aspeto de módulo de recursos humanos.

## lvl11.png — POS & Retalho

Screenshot realista de um **terminal POS touchscreen**: grelha de botões de produtos com imagens/thumbnails e preços, à direita o **talão (FS)** com linhas e total "48,90€", botões grandes "Fechar dia" / "Pagamento". Interface de caixa otimizada para toque, clara e legível.

## lvl12.png — Suporte / Pós-venda (PAT)

Screenshot realista de um ecrã de **suporte técnico**: lista de PATs (Pedidos de Assistência) com estados e prioridades coloridas, KPIs ("PATs abertos 7", "SLA ok 92%", "First-time-fix 81%") e a ficha de um PAT com equipamento, nº de série e histórico de intervenções.

---

## (Opcionais, se quiseres reforçar)

### hero.png — Herói da Jornada

Composição realista wide: secretária moderna com monitor a mostrar o dashboard do ERP (KPIs + gráfico), teclado, bloco de notas com "C:\PHC-Treino" e uma chávena de café; luz quente de escritório. Sem pessoas, sem marcas.

### og.png — Imagem social (1200×630)

Cartão de partilha: fundo escuro `#0d1220`, título "PHC Trainer Pro", subtítulo "Formação prática · Gestão Cegid PHC Evolution", mascote Einstein ilustrado à direita, acento laranja. (Pode ser ilustração, não screenshot.)

---

## Checklist de nomes (copia/cola)

```
lvl0.png lvl1.png lvl2.png lvl3.png lvl4.png lvl5.png lvl6.png
lvl7.png lvl8.png lvl9.png lvl10.png lvl11.png lvl12.png
 hero.png og.png
```

Depois de os colocares em `apps/web/public/img/guia/`, faz commit + push — a Vercel redeploya e as imagens reais aparecem automaticamente na missão/nível correspondente.
