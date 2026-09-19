# Guia Completo do Técnico Expert — Módulo Gestão do Cegid PHC Evolution (Desktop)

> **Objetivo:** ser o documento de referência para dominar a 100% o módulo **Gestão** do **Cegid PHC Evolution / PHC CS Desktop** — funcionalmente, na configuração, na fiscalidade e no desenvolvimento de soluções personalizadas.
>
> **Data da pesquisa:** setembro de 2026. Versão de referência documentada: **202601** (a PHC passou de numeração "v18…v30" para numeração por ano/edição, ex.: 202501, 202504, 202601).
>
> **Nota importante:** parte da documentação profunda da PHC (Comunidade PHC, manuais internos, dicionário de dados completo, ferramentas de parceiro) exige credenciais de **Cliente/Parceiro + ID Técnico**. Este guia mapeia tudo o que existe, indica onde está e como se acede, e cobre em detalhe o que é público. Onde um detalhe fino depende da versão/gama/país, está assinalado para validação no Help Center ou na aplicação.

---

## Índice

1. [O ecossistema Cegid PHC e o produto](#1-o-ecossistema-cegid-phc-e-o-produto)
2. [Arquitetura técnica da plataforma](#2-arquitetura-técnica-da-plataforma)
3. [Instalação, infraestrutura e administração](#3-instalação-infraestrutura-e-administração)
4. [Módulo Gestão — mapa funcional completo](#4-módulo-gestão--mapa-funcional-completo)
5. [Configuração do módulo Gestão (o dia-a-dia do técnico)](#5-configuração-do-módulo-gestão-o-dia-a-dia-do-técnico)
6. [Fiscalidade e obrigações legais (Portugal e outras geografias)](#6-fiscalidade-e-obrigações-legais)
7. [Desenvolvimento e personalização (Framework PHC)](#7-desenvolvimento-e-personalização-framework-phc)
8. [Base de dados: estrutura e boas práticas](#8-base-de-dados-estrutura-e-boas-práticas)
9. [Integrações e ecossistema](#9-integrações-e-ecossistema)
10. [Operação, suporte, diagnóstico e performance](#10-operação-suporte-diagnóstico-e-performance)
11. [Formação, certificação e recursos oficiais](#11-formação-certificação-e-recursos-oficiais)
12. [Plano de estudos até ao nível expert](#12-plano-de-estudos-até-ao-nível-expert)
13. [Checklists de autoavaliação](#13-checklists-de-autoavaliação)
14. [Glossário PHC](#14-glossário-phc)
15. [Fontes e links de referência](#15-fontes-e-links-de-referência)

---

## 1. O ecossistema Cegid PHC e o produto

### 1.1 História e contexto atual

- A **PHC Software** (PHC Business Software) foi fundada em **Portugal em 1989** e tornou-se num dos ERPs de referência do mid-market português, com forte presença nos PALOP (Angola, Moçambique, Cabo Verde), Espanha e Peru.
- Em **janeiro de 2025**, a **Cegid** (grupo francês, dono também da Primavera BSS) adquiriu a PHC. Todos os produtos passam a chamar-se **"Cegid PHC"**.
- O produto desktop histórico chamava-se **PHC CS** (Client/Server). O **Cegid PHC Evolution** é o **sucessor direto do PHC CS**: mesma plataforma, mesma base de dados, mesma framework — com modelo de **subscrição**, acesso **web incluído**, IA (**Cegid Pulse**), gestão documental cloud (**Cegid Docs**) e **open banking**.
- O licenciamento **perpétuo do PHC CS foi descontinuado**: clientes novos subscrevem o Evolution; clientes com PHC CS perpétuo têm de planear migração (que é, na prática, uma evolução da mesma instalação).

### 1.2 A família de produtos Cegid PHC

| Produto                               | O que é                                                                                                | Público                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **Cegid PHC Evolution**               | ERP desktop + web (sucessor do PHC CS). Objeto deste guia.                                             | PME e mid-market                               |
| **Cegid PHC GO**                      | Gestão 100% cloud nativa (SaaS), planos Corporate/Advanced/Enterprise                                  | Micro e pequenas empresas                      |
| **Cegid Pulse**                       | Ecossistema de agentes de IA integrado no ERP (assistente "Cris", assistentes de negócio, Smart Tools) | Transversal (Evolution a partir do plano Plus) |
| **Cegid Docs**                        | Gestão documental e arquivo digital legal na cloud, integrado no ERP                                   | Transversal                                    |
| **EyePeak (Cegid Primavera EyePeak)** | Plataforma de logística/WMS/e-commerce que sincroniza com o ERP PHC                                    | Logística, retalho, B2B                        |
| **PHC CS Web**                        | Plataforma web do CS/Evolution (aplicações Gestão Web, Front Web, POS Web, RH Web…)                    | Acesso remoto/browser                          |

### 1.3 Cegid PHC Evolution: planos e gamas

O Evolution combina **duas dimensões** que o técnico tem de distinguir bem:

**a) Planos de subscrição (modelo comercial atual):**

| Plano    | Utilizadores incluídos | Base de dados | Acesso Web | Cegid Pulse (IA) | Capacidade de personalização |
| -------- | ---------------------- | ------------- | ---------- | ---------------- | ---------------------------- |
| Standard | 1                      | 10 GB         | –          | –                | Baixa                        |
| Plus     | 2                      | 10 GB         | ✓          | ✓                | Baixa                        |
| Advanced | 3                      | Ilimitada     | ✓          | ✓                | Média                        |
| Premium  | 3                      | Ilimitada     | ✓          | ✓                | Média                        |
| Ultimate | 5                      | Ilimitada     | ✓          | ✓                | Alta                         |

**b) Gamas funcionais (herança PHC CS, ainda visível na documentação e em funcionalidades):**

- **Corporate** — micro e pequenas empresas. Funcionalidade essencial, sem ferramentas de personalização/análise avançadas.
- **Advanced** — PME. Acrescenta a capacidade de **personalizar o software** (campos/regras/filtros/eventos do utilizador, análises avançadas, snapshots, workflow operacional, etc.).
- **Enterprise** — topo de gama. Acrescenta, entre outros, **Sistema de Aprovação de Dossiers**, páginas/objetos de utilizador com eventos Xbase completos, log de atividade (v30+), e componentes "Executive" da framework.

> Consequência prática: **o que consegue configurar/desenvolver depende do plano + gama do cliente**. Muitas ferramentas da Framework PHC só aparecem com parâmetros ativos e gama Advanced/Enterprise. Verifique sempre isto primeiro num projeto.

### 1.4 Módulos do ERP e onde o Gestão se insere

O **PHC Gestão** é o módulo nuclear (comercial + financeiro operacional). O ecossistema de módulos que com ele interage:

- **Gestão** (clientes, fornecedores, stocks, faturação, compras, tesouraria) — _este guia_
- **Contabilidade** (+ PHC XL para grandes volumes/centros analíticos)
- **Imobilizado**
- **Pessoal / Recursos Humanos** (vencimentos)
- **POS / Retalho** (POS Desktop, POS Front, POS Web, touch)
- **Suporte** (assistência técnica, contratos, instalações/equipamentos, PATs)
- **Manufactor** (produção: ordens de fabrico, operações, centros de trabalho)
- **Obras** e **Ocupação** (setoriais)
- **Frota** (viaturas), **Equipamentos** (números de série), **Ecovalor** (taxas ecológicas)
- **SMS**, **Documentos Eletrónicos** (faturação eletrónica/EDI), **Dashboard**, **Notify** (alertas/notificações)
- **PHC CS Web** (Gestão Web, Front Web — extranet de clientes/fornecedores)
- **Cegid Pulse** (IA) e **Cegid Docs** (documental)

O módulo Gestão é frequentemente designado na documentação por **"PHC CS Gestão desktop"** e tem um manual próprio no Help Center, complementado pelo manual do módulo **Stocks**.

### 1.5 Versionamento e o acordo PHC On

- Histórico de versões: … v18, v19, v22, v25, v26, **v27** (QR Code + ATCUD, 2020/21), **v28** (2021), **v29** (2022), **v30** (2023; log de atividade Enterprise) e, depois, numeração anual: **202401 → 202501 → 202504 → 202601**…
- O **PHC On** é o acordo anual de atualização: dá direito a **todas as versões e alterações legislativas durante um ano**, acesso ao portal `on.phc.pt` com **formação online, autoformação (filmes temáticos), truques e dicas, novidades exclusivas, motor de procura e o Calendário PHC** (alertas de obrigações fiscais/laborais, sincronizado por webservice).
- Como técnico: **manter o cliente atualizado é requisito de conformidade fiscal** (a AT exige versões atuais — houve comunicações oficiais do tipo "apenas a versão X cumpre os requisitos da AT"). As novidades de cada versão são publicadas na página de Novidades do Help Center e em PDFs "Listagem de Novidades" (os parceiros publicam-nos, ex.: Arentia, Winsig, NSoft).

### 1.6 Geografias / executáveis

A plataforma tem executáveis e comportamentos específicos por país: **PT (Portugal), ES (Espanha — SII, TicketBAI, províncias, documentos eletrónicos), PE (Peru — retenções), US (English)**, além de PT/AO/MZ/CV para as obrigações lusófonas. Muitas configurações fiscais (retenções, comunicação à AT) só fazem sentido no executável PT. Confirme sempre qual o executável e país da instalação.

---

## 2. Arquitetura técnica da plataforma

### 2.1 Modelo geral

- **Arquitetura client/server**: cliente desktop rico (histórico em **Visual FoxPro**, com linguagem de personalização **Xbase**) + **Microsoft SQL Server** como base de dados.
- O acesso à BD faz-se por **ODBC** — a instalação cria/configura automaticamente o DSN (o "exe único" instala a aplicação, faz o _attach_ da base de dados e cria o ODBC).
- A mesma base de dados serve o **desktop** e o **PHC CS Web** (plataforma web ASP.NET, personalizável em **C#**), que partilha tabelas e framework.
- **Cada empresa = uma base de dados** (instalações multiempresa usam várias BDs; há ferramentas de consolidação/arquivo).
- A aplicação é tolerante a quebras de ligação ao SQL Server (existe monitor de ligação por instância de SQL).

### 2.2 Componentes e conceitos de plataforma

| Componente                                                 | Descrição                                                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Executável único**                                       | Instalador que coloca aplicação + faz attach da BD + cria ODBC                                                                               |
| **Supervisor**                                             | Menu de administração: Framework PHC, tratamento da base de dados (dicionário de dados, desfragmentação), EyePeak Sincronização, monitores   |
| **Menu Sistema**                                           | Parâmetros (gerais e por módulo), configuração da aplicação                                                                                  |
| **Ecrãs em memória**                                       | Parâmetro de performance: ecrãs principais mantêm-se em memória ao fechar (reabertura instantânea)                                           |
| **Processamento assíncrono**                               | Parâmetro "Usa processamento assíncrono" — gravação de documentos em background (o documento fica com flag de "não processado" até concluir) |
| **File Storage**                                           | (202501+) Armazenamento de anexos em diretoria física, na BD ou em ambos; documentos fiscalmente relevantes ficam sempre na BD               |
| **Base de dados de Arquivo**                               | Passagem de dados históricos para BD de arquivo (performance)                                                                                |
| **Cegid Account**                                          | (202601+) Autenticação híbrida com contas Microsoft/Google, 2FA, ativação por utilizador                                                     |
| **Barra de status estendida / Painel central / Navegador** | Componentes de UI configuráveis por parâmetros (gamas superiores)                                                                            |
| **Análise Interna**                                        | Registo de erros de execução de código do utilizador (eventos Xbase) — ferramenta de diagnóstico essencial                                   |
| **Log de Código**                                          | (Web) informação de execução do código de utilizador (eventos, regras)                                                                       |
| **Log de atividade**                                       | (v30+, Enterprise) auditoria de consultas/alterações/apagamentos por utilizador                                                              |

### 2.3 Requisitos de infraestrutura (referência)

- **Servidor:** Windows Server 2012 ou superior (validar sempre o Manual de Instalação da versão em causa — disponível na Comunidade PHC/Help Center).
- **Base de dados:** Microsoft SQL Server 2012 ou superior (os termos de licenciamento indicam SQL Server 2008R2+ como mínimo histórico; na gama Corporate é típico usar **SQL Server Express**).
- **Clientes:** Windows 10/11 (ou Windows Server para postos em Terminal Server/RemoteApp — suportado e comum).
- **Rede:** o desktop liga por ODBC/SQL (porta 1433); o PHC CS Web requer IIS/servidor web + ligação à mesma BD.
- **Hardware na HCL** (Hardware Compatibility List) para impressoras de documentos, TPA, terminais portáteis/PDA, etc.
- **Licenciamento:** por **utilizador nomeado/concorrente** conforme plano; subscrição anual no Evolution. A validação é feita por ficheiro de licenças associado ao nº de cliente.

### 2.4 Segurança e RGPD (nativo da plataforma)

- **Utilizadores e Grupos de utilizadores** (ou **Perfis** — há um parâmetro "Definição de tipos de acessos": por Grupos ou por Perfis).
- Acessos por ecrã/operação (consultar, introduzir, alterar, apagar, reimprimir, totalizar, anexar…), **acessos a parâmetros por utilizador**, e controlo de programas executáveis a que cada grupo acede.
- **RGPD:** aviso legal configurável, registo do tratamento de dados, **processamento de dados pessoais (direito ao esquecimento/anonimização)**, histórico de utilizadores.
- **Histórico/Tracking de ações** e **log de atividade** (Enterprise) para auditoria.

---

## 3. Instalação, infraestrutura e administração

> Este capítulo segue de perto o programa oficial da **Certificação PHC CS Desktop** — é exatamente isto que a PHC considera o núcleo técnico da função.

### 3.1 Instalação passo-a-passo (visão de certificação)

1. **Preparar o servidor**: Windows Server suportado, verificar HCL, antivírus/firewall (exceções para SQL e para a pasta da aplicação).
2. **Instalar o SQL Server** (ou SQL Express na gama Corporate): instância, modo de autenticação misto, protocolos TCP/IP ativos, collation recomendada pela PHC.
3. **Instalar o PHC** com o executável único: o instalador trata da BD (criação/attach), do ODBC e dos atalhos.
4. **Criar/registar a empresa** (base de dados) e aplicar a **licença** (nº de cliente + plano/gama + módulos).
5. **Criar utilizadores e logins** (SQL + aplicação), configurar grupos/perfis e acessos.
6. **Configurar parâmetros** gerais e do módulo (ver capítulo 5).
7. **Backups**: plano de backups do SQL (full + logs), testar restauro; usar também as rotinas de "Backup de Base de Dados" da aplicação.
8. **Atualizações**: procedimento de upgrade de versão (sempre com backup prévio, em horário sem utilizadores; validar personalizações após upgrade).
9. **Postos de trabalho**: instalar o cliente, apontar ao ODBC/servidor; em Terminal Server validar perfis Windows.

### 3.2 Manutenção da base de dados

- **Detach/Attach** de bases de dados (migrações, clones de teste).
- **Desfragmentar as Tabelas Principais** (utilitário documentado no Help Center) + manutenção de índices do SQL (rebuild/reorganize, estatísticas).
- **Base de dados de arquivo** para históricos pesados.
- **Índices de utilizador** (Framework PHC) — incluindo _INCLUDED COLUMNS_ — para acelerar consultas personalizadas sem tocar no core.
- **Monitor de ligação** ao SQL por instância (diagnóstico de quebras de rede).
- **Explorador de dados** e **Simulador de SQL** (permite executar consultas à BD a partir da aplicação, com variáveis como `#stamp#`).

### 3.3 Rotina de saúde de uma instalação (checklist do técnico)

- [ ] Versão do software e do PHC On atualizadas (conformidade AT)
- [ ] Backups automáticos + teste de restauro documentado
- [ ] Utilizadores nomeados, acessos mínimos necessários, passwords/2FA
- [ ] Parâmetros de faturação/séries revistos antes de cada viragem de ano (códigos de validação AT, ATCUD)
- [ ] Manutenção de índices/desfragmentação agendada
- [ ] Espaço em disco da BD vs. plano contratado (10 GB nos planos Standard/Plus)
- [ ] Personalizações documentadas (código Xbase/C#, regras, campos de utilizador) para sobreviverem a upgrades
- [ ] Ligações externas testadas: webservice AT, e-mail SMTP, EyePeak, Cegid Docs, open banking

---

## 4. Módulo Gestão — mapa funcional completo

### 4.1 Ficheiros (dados mestres)

**Clientes (tabela CL + CL2 "Outros Dados")**

- Nº de contribuinte com país associado; serviço **Ignios** (Advanced+) preenche automaticamente nome/morada a partir do NIF.
- **Sede (0) e filiais/estabelecimentos (1–999)** — noção de estabelecimento vs. sede.
- Campos: abreviatura, morada, localidade, código postal (preenchimento automático configurável), país, província (ES), telefone/fax/e-mail/WWW/telemóvel (com envio de SMS via módulo SMS), contribuinte do representante, **idioma** (descrições de artigos em documentos), **zona** (campo de tabela do utilizador), tipo de cliente, classificação de vendas, segmento, refª interna, centro analítico (XL), condições de pagamento, forma de pagamento, descontos, tabela de preços, vendedor, limites de crédito…
- **Inativos**: deixam de aparecer em opções/documentos novos, mas mantêm-se em análises e permitem faturar dossiers antigos.
- Regras de integridade de documentos certificados: com documentos certificados emitidos, há campos que ficam bloqueados a alterações (ex.: não alterar NIF de cliente com documentos certificados; regras nome/morada/NIF).
- Parâmetro "Quando altera dados do cliente, não atualiza tabelas relacionadas" controla a propagação de alterações a C/C, Documentos e Recibos.
- **Moradas de Carga e Descarga** (tabela própria) alimentam os campos "Local de carga/descarga" dos documentos de transporte (ShipFrom/ShipTo no SAF-T).

**Fornecedores (FI)** — estrutura análoga à de clientes; conta corrente de fornecedores, adiantamentos, aprovação de pagamentos, compras com/sem IVA, autofaturação.

**Stocks e Serviços (artigos)** — manual próprio do módulo **PHC CS Stocks desktop**:

- Ficheiro de referências com designação (multi-idioma), família, marca, unidade e **unidade alternativa com factor de conversão** (e inversão do factor), código de barras/EAN, imagem.
- **Referências alternativas** (mesmo artigo com várias refs de cliente/fornecedor), designação do artigo por cliente/fornecedor (impressão no idioma definido).
- **Compostos (Kits)** — produtos compostos por componentes.
- **Grelha de cores e tamanhos** (vestuário/calçado).
- **Lotes** (rastreabilidade, validades) e **números de série** (com o módulo Equipamentos).
- Preços: preço de venda por tabela (com validades), preço de custo, **PCMP — Preço de Custo Médio Ponderado** (método de custeio usado no cálculo do valor de stock), margens, contribuição.
- Stocks: stock atual por armazém, reservado para cliente, encomendado a fornecedor, quantidade esperada, stock cativo e pré-cativo, stock mínimo/máximo, ponto de encomenda, ruturas.
- **Ecovalor** (módulo adicional) para taxas ecológicas.

### 4.2 Vendas e faturação

- **Documentos de Faturação (tabela FT)** configuráveis por **série**: tipos de documento **1, 2, 3** (Fatura, Fatura Simplificada, Fatura-Recibo, Nota de Débito, Nota de Crédito — mapeados para SAF-T como FT/FS/FR/ND/NC), **tipo 4 = documento de transporte (Guia de Remessa)** e **tipo 5 = Outro (Proforma)**.
- Cada série define: o que movimenta (**conta corrente, stocks, tesouraria**), numeração, tipo para SAF-T, motivo de isenção nas linhas, validação de locais de carga/descarga, envio de SMS ao motorista com o código da AT, comunicação por webservice vs. ficheiro, etc.
- Emissão, alteração, anulação (**documento anulado + motivo de anulação obrigatório**), reimpressão controlada por acessos, consulta e totais por múltiplos critérios.
- **Atualização automática** ao emitir: stocks (baixa de artigos), conta corrente (saldos, idades), ficha do cliente (faturação acumulada).
- **Emissão automática de faturação**: faturar em massa por cópia de outros documentos ou de **dossiers internos** (guias, encomendas, propostas, folhas de obra) com ecrã de preparação/seleção.
- **Vendas a dinheiro**, faturas-recibo, **recibos de adiantamento** e sua regularização (gera NC automática com motivo de retificação "Retificação de Fatura de Adiantamento").
- **Retenção de IRS na fonte** em documentos (taxa + valor de retenção; visível no mailing de C/C).
- Campos fiscais/operacionais do documento: classificação de vendas, local de carga/descarga, idioma, data/hora de carga, **data efetiva de entrega** (obrigatória por lei; comunicada no SAF-T), matrícula da viatura (Frota ou tabela de **Viaturas de Expedição**), motorista, linha final (texto livre), segmento, expedição, refª interna, centro analítico, operação triangular UE, código EAN (Documentos Eletrónicos), Cód. Ident. AT (documentos de transporte), **ATCUD + QR Code** em layouts.
- **Multibanco**: disponibilização de referências multibanco para cobrança.
- **e-TaxFree** (vendas a turistas), **Pagamentos via Unicre/PayPal** (com PHC CS Web), **faturação eletrónica** (Documentos Eletrónicos, CIUS-PT, SaphetyDoc por webservice).

### 4.3 Dossiers Internos (DI — tabela BO)

Conceito central do PHC: **documentos parametrizáveis pelo utilizador para uso interno**, que alimentam o circuito comercial:

- **Orçamentos/Propostas**, **Encomendas de Cliente**, **Encomendas a Fornecedor**, **Folhas de Obra**, **Consignações**, e dossiers à medida (o utilizador cria tipos de DI).
- **Circuito (conversões)**: Orçamento → Encomenda → Guia → Fatura; Encomenda a Fornecedor → "Comprar a Encomenda a Fornecedor" (gera compra); "Faturar a Encomenda de Cliente"; cópias entre DI, Faturação e Compras com opções de cópia configuráveis.
- **Dossiers especiais** (conteúdo da certificação Advanced): **Dossier de Stock Inicial**, **Dossier de Transferência de Armazém**, **Dossier de Preços (Cliente/Fornecedor)**, **Dossier de Avenças** (faturação recorrente), **Dossier de Composição e de Produção**.
- **Sistema de Aprovação de Dossiers** (gama Enterprise) e **Workflow Operacional** (Advanced+) para circuitos de aprovação.
- Análises de DI (mapas de acompanhamento, conversão, pendentes).

### 4.4 Compras

- Documentos de compras (faturas de fornecedor, guias de entrada, notas de débito/crédito de compra), com gestão de IVA, retenções e custos acessórios.
- **Comprar a partir de Encomenda a Fornecedor**; receção por guia e faturação posterior.
- **Gestão de aprovação para pagamentos** a fornecedores; **adiantamentos a fornecedores**.
- **Faturas de fornecedor eletrónicas**: com Cegid Docs, as faturas CIUS-PT são anexadas em PDF e **pré-lançadas** automaticamente.
- **Espanha**: envio de documentos de Compras para o **SII** (funções internas na framework/alertas).

### 4.5 Stocks e armazéns

- **Armazéns** múltiplos; **Códigos de Movimentos de Stocks** (tipos de movimento configuráveis).
- Movimentos automáticos por documentos (faturação/compras/guias) e manuais (regularizações, transferências entre armazéns via dossier).
- **Inventário físico (contagens)**: contagens por armazém/família, lançamento automático de **acertos (quebras/sobras)** no ficheiro de movimentos; **comunicação do inventário à AT** (ficheiro SAF-T/CSV/XML conforme faturação do ano anterior — artigo oficial "Comunicação de inventário à AT: onde, quando e como quiser").
- Análises de stock: produtos com maior lucro, **rankings de vendas**, contributo nos custos, acima do stock máximo, a encomendar, em rutura, entradas/saídas mensais com comparação anual, valor de stock.
- **Lotes** e **números de série**; **stock cativo/pré-cativo**; ligação a **terminais portáteis (PDA)** para contagens/movimentos.

### 4.6 Conta corrente, cobranças e pagamentos

- **Códigos de Conta Corrente** (tabela de tipos de movimento de C/C), movimentos por documento, saldos e **saldos por idades** (aging).
- **Recibos de clientes (RE)** — normais ou de adiantamento; **Pagamentos a fornecedores**; **liquidação/regularização** de documentos por recibos/pagamentos (total ou parcial).
- **Controlo de cobranças**: monitor de controlo de dívidas de clientes, **mailing de C/C** (avisos por documento), gestão de **cheques em carteira**, **letras/títulos**.
- **Recibos incobráveis** (tratamento fiscal).
- **Cobranças via banco**: ficheiros **SEPA** (débitos diretos), transferências em lote (ficheiro SEPA de pagamentos), **WebBanking** (histórico: Millennium BCP) e **open banking** no Evolution (reconciliação e previsões aceleradas).
- **Referências Multibanco** para receber mais rápido.

### 4.7 Tesouraria e bancos

- **Contas de Tesouraria** (caixas e bancos), **Códigos de Tesouraria** (tipos de movimento), movimentos constantes de tesouraria.
- **Extratos bancários** e reconciliação; **transferências bancárias**; **gestão de títulos de tesouraria** (letras, cheques).
- **Tesouraria real, previsional e orçamental** — previsões com base em documentos pendentes/vencimentos; orçamentos de tesouraria.
- No Evolution: **open banking** nativo para importar movimentos e acelerar reconciliações.

### 4.8 Política comercial

- **Tabelas de preços** múltiplas **com validades** (saber sempre o preço atual); preços por cliente/fornecedor (dossier de preços).
- **Tipos de desconto** e descontos automáticos (por tipo de cliente, tipo de artigo, quantidade, valor — configuração disponível em web desde 202501); descontos em cascata (Desc.1, Desc.2…).
- **Promoções e campanhas** (com datas de validade; na gama Advanced/Enterprise há opções extra de promoção no módulo Gestão desktop), **rappel** de clientes e fornecedores (descontos de fim de período por volumes).
- **Comissões**: por vendedor, por tipo de cliente, por famílias de produtos, etc.; mapas de comissões.
- **Vendedores** e zonas; classificação de clientes para análises de vendas.

### 4.9 Análises, mapas e dashboards

- **Mapas definidos** (relatórios standard configuráveis) e **impressão definida pelo utilizador** (Advanced+): layouts personalizáveis de documentos e listagens; **templates** de documentos.
- **Análises de utilizador** (consultas SQL apresentadas em grelha, com filtros de utilizador) e, na gama Advanced, **Análises Multidimensionais** criadas a partir de análises de utilizador (cubos OLAP-like para drill-down).
- **Snapshots** ( Advanced+): "fotografias" de dados com instruções T-SQL e variáveis (ex.: `#stamp#`), agrupáveis com cores; úteis para monitores e painéis.
- **Painéis de informação / Painel central / Dashboards**: visão 360º num só ecrã (ex.: template de Dashboard para o módulo Gestão, se adquirir o **PHC Dashboard**); monitores (ex.: controlo de dívidas).
- **Rankings** e análises de faturação por segmento/zona/vendedor/família.
- **Cegid Pulse** (IA, plano Plus+): perguntas em linguagem natural sobre vendas/tesouraria/stocks, **assistentes de negócio** (o primeiro é o comercial) e **Smart Tools** que os parceiros podem configurar e monetizar.
- Exportação de listagens para **Excel/PDF**, cópia de dados a partir de grelhas, "Alterações de seguida em Excel", **Importar Excel para linhas** de documentos.

### 4.10 Integração Gestão → Contabilidade

(Tópico obrigatório da certificação; o técnico de Gestão tem de o dominar.)

- **Documentos pré-definidos** (na Contabilidade e na Gestão): regras de contabilização automática por tipo de documento.
- **Integrações da Gestão na Contabilidade**: configuração de contas (clientes, fornecedores, IVA, contrapartidas), integração de faturação, compras, recibos e pagamentos (com informação do documento original no descritivo — Advanced+).
- **Apuramento do IVA** a partir dos documentos; **Declaração Periódica de IVA**; **CEVMC** (custo das mercadorias vendidas e consumidas); apuramento de resultados.
- **Mapas de Gestão** (importação/emissão) e **PHC XL** (centros analíticos, grandes volumes).
- **Taxonomia** (tabela de taxonomia SNC para mapping contabilístico).

---

## 5. Configuração do módulo Gestão (o dia-a-dia do técnico)

### 5.1 Onde se configura o quê

| O quê                          | Onde                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parâmetros gerais e por módulo | Menu **Sistema → Parâmetros** (gerais, faturação, stocks, tesouraria…). Acesso protegido e configurável **por utilizador**                                                                                                                                                                                                  |
| Séries e tipos de documento    | **Configuração de Documentos de Faturação** (séries: tipo 1–5, mapping SAF-T, numeração, o que movimenta, opções AT)                                                                                                                                                                                                        |
| Dossiers internos              | Configuração de tipos de DI (nome, séries, o que movimenta, conversões permitidas)                                                                                                                                                                                                                                          |
| Tabelas base                   | IVA/taxas, motivos de isenção (M01–M99), condições de pagamento, formas de pagamento, bancos/contas de tesouraria, códigos de C/C, códigos de tesouraria, códigos de movimentos de stock, zonas, países, moedas/câmbios, idiomas, viaturas de expedição, moradas de carga/descarga                                          |
| Ficheiros                      | Clientes, fornecedores, artigos (com famílias/marcas), vendedores, tabelas de preços, descontos, armazéns, lotes                                                                                                                                                                                                            |
| Framework (personalização)     | Menu **Supervisor → Framework PHC**: campos de utilizador, regras, valores por defeito, teclas de utilizador, funções de utilizador, instruções internas, alertas de utilizador, índices de utilizador, tabelas de utilizador, ecrãs personalizados, páginas/objetos (Enterprise), consultas, snapshots, monitores, filtros |
| Base de dados                  | **Supervisor → Tratamento da base de dados**: Dicionário de Dados, desfragmentação, arquivo                                                                                                                                                                                                                                 |
| Impressão                      | Editor de mapas/templates, "Impressão Definida pelo Utilizador" (Advanced+), definições de assinatura                                                                                                                                                                                                                       |

### 5.2 Parâmetros essenciais que tem de conhecer a frio

Exemplos de parâmetros da plataforma/módulo que aparecem em quase todos os projetos (a lista exata varia por versão/gama — validar no ecrã de Parâmetros e no manual "Parâmetros"):

**Gerais/plataforma:**

- Definição de tipos de acessos (por **Grupos** ou por **Perfis**)
- Usa ecrãs em memória (performance)
- Mostrar último registo ao arrancar ecrã (desligar em BDs grandes = ecrãs mais rápidos)
- Utiliza campos do utilizador? / ecrãs do utilizador? / funções do utilizador? / filtros de utilizador? / páginas do utilizador? / navegador? / painel central? — **ativam as ferramentas da Framework** (algumas só gama Executive/Enterprise)
- Utiliza multi-língua? (idiomas de descrições)
- Usa processamento assíncrono (gravação de documentos)
- Primeiro dia da semana / nº da semana
- Diretório por defeito para imagens; logótipo (na BD ou caminho); imagem de fundo
- Intervalo de refrescamento de alertas
- Barra de status estendida; painéis no menu; teclas do utilizador em rodapé

**Faturação (Parâmetros de Faturação):**

- Percentagem de retenção de IRS
- Método de envio de faturas emitidas (**Webservice** vs. ficheiro) → influencia motivos de isenção disponíveis (só M01–M99 aceites pelo webservice)
- Método de envio de **documentos de transporte** (webservice AT vs. **SAF-T (PT) resumido**)
- Preenche e valida Local de Carga/Descarga
- Utiliza data efetiva de entrega nas linhas
- Utiliza motivo de isenção nas linhas
- Comportamento de alterações de dados de cliente em tabelas relacionadas
- Envio de SMS (módulo SMS) e SMS ao motorista com código da AT

**Stocks/Compras/Tesouraria:** parâmetros de custeio (PCMP), stocks negativos, lotes/séries, armazém por defeito, códigos de movimento; aprovação de pagamentos; contas e bancos por defeito; referências multibanco; SEPA.

### 5.3 Configuração de uma série de documentos (receita)

1. Criar a **série** (código, descrição, tipo de documento 1–5, documento SAF-T correspondente: FT/FS/FR/NC/ND/GT…).
2. Definir **o que movimenta**: stocks? conta corrente? tesouraria?
3. **Numeração**: sequência por série/ano; regras de nº de documento.
4. Opções fiscais: motivo de isenção (cabeçalho ou linhas), validação de transporte (locais, data/hora), ATCUD.
5. **Comunicação à AT**: para documentos de transporte — método (webservice ou SAF-T resumido); opção de SMS ao motorista com o código da AT.
6. **Layout de impressão**: template com QR Code + ATCUD (obrigatório em documentos fiscalmente relevantes).
7. **Acessos**: quem pode emitir/alterar/anular/reimprimir.
8. Para vendas a dinheiro/consumidor final: regras de cliente genérico e NIF.

### 5.4 Viragem de ano / obrigações periódicas de configuração

- **Comunicar séries à AT** antes de as usar (ATCUD): a AT devolve o **código de validação da série**, que se associa na configuração — sem ele, **a impressão de documentos é bloqueada** (regra em vigor desde 2021).
- Carregar tabelas fiscais novas (retenções IRS com data de vigência — 202601 permite coexistência de tabelas antigas/novas).
- Rever motivos de isenção de IVA (atualização manual ou automática — 202501+).
- Inventário: contagem e **comunicação à AT até 31 de janeiro** (quando aplicável).
- Verificar calendário de obrigações no **Calendário PHC** (PHC On).

---

## 6. Fiscalidade e obrigações legais

> Um expert em Gestão PHC é, na prática, um especialista em conformidade fiscal portuguesa aplicada ao ERP. A PHC publica artigos oficiais para cada obrigação — todos citados nas fontes.

### 6.1 Certificação do software e assinatura

- O software é **certificado pela AT (ex-DGCI)** — nº de certificado impresso nos documentos.
- **Assinatura digital qualificada/hash** dos documentos obrigatória (artigo oficial: "Assinatura digital qualificada nas faturas é obrigatória a partir de 1 de janeiro") — cadeia de hashes que garante a integridade; documentos certificados bloqueiam alterações a dados fiscais de clientes.
- Regras de **faturação**: obrigação de emissão, prazos, documentos retificativos (NC com **motivo de retificação** obrigatório), anulação com motivo.

### 6.2 SAF-T (PT)

- **SAF-T de faturação (auditoria)**: exportação mensal para a AT (e-fatura) e para o contabilista; inclui campos de controlo como a indicação de documento exportado para o SAF-T de auditoria, e o mapeamento de tipos de documento (FT, FS, FR, NC, ND, GT, GA, GC…).
- **SAF-T (PT) resumido para documentos de transporte**: alternativa ao webservice para comunicar guias; exporta `ShipFrom`/`ShipTo` (locais de carga/descarga) na tabela `MovementOfGoods`.
- **Comunicação de documentos de transporte à AT**: por **webservice** (tempo real, antes do início do transporte; devolve o **Cód. Ident. AT** que pode seguir por SMS ao motorista) ou por **SAF-T resumido**.
- **Comunicação de inventário** via SAF-T/CSV/XML.
- Boas práticas: validar o SAF-T no validador da AT/Portal das Finanças após cada mudança de configuração; testar com documentos isentos (motivos M01–M99), NC/ND, autofaturação.

### 6.3 ATCUD e QR Code

- Desde 2021 (v27+): **todas as faturas e documentos fiscalmente relevantes** incluem **QR Code** e **ATCUD** (código único do documento: código de validação da série + número sequencial).
- Passos: comunicar séries à AT → receber código de validação → associá-lo na série no PHC → garantir **layouts preparados** com QR e ATCUD → o software **impede a impressão** de documentos de séries não validadas.

### 6.4 e-Fatura e faturação eletrónica

- **Método de envio de faturas emitidas**: webservice à AT em tempo real (parâmetro) ou via SAF-T mensal pelo contabilista.
- **Faturação eletrónica**: módulo **Documentos Eletrónicos** (código EAN da empresa, EDI), integração **SaphetyDoc via webservice** (artigo oficial no Help Center: "Comunicação de Documentos com SaphetyDoc via Webservice no PHC CS Desktop"), e **CIUS-PT** para faturação à Administração Pública; com **Cegid Docs**, PDFs de faturas de fornecedor CIUS-PT são **anexados e pré-lançados** automaticamente (202601).
- **e-TaxFree** (turistas) e vendas intra-comunitárias (**operações triangulares**, Intrastat).

### 6.5 Impostos e retenções

- **IVA**: taxas, motivos de isenção (tabela M01–M99 sincronizada com webservice), IVA de caixa (se aplicável), apuramento via Contabilidade, **Declaração Periódica de IVA**.
- **Retenções na fonte**: IRS (faturas com taxa/valor de retenção), IRC, **Imposto do Selo** — o Calendário PHC documenta o tratamento no software.
- **Modelo 22 / IRC** (202601 atualizou apuramento de IRC 2025), **Modelo 30** (rendimentos pagos a não residentes — guia passo-a-passo oficial), **DMR** (não emitir valores negativos — 202601).
- **Espanha**: **SII** (Suministro Inmediato de Información AEAT) e **TicketBAI** — parâmetro geral com 4 opções (202601); funções internas "Enviar documentos de Compras/Vendas para o SII".
- **Peru**: cálculo de retenção nas vendas (taxa de retenção no documento).

### 6.6 Novas obrigações 2026 (versão 202601)

- **SDR — Sistema de Depósito e Recolha**: desde **10 de abril de 2026**, depósito de **0,10 €/unidade** em embalagens de bebidas de uso único (até 3 L). Configuração única dos "itens SDR" no software; o depósito é aplicado automaticamente em cada venda. Retorno de embalagens/vales gerido maioritariamente por RVM (máquinas) — integração ERP↔RVM para estabelecimentos ≥400 m² **não é standard** (oportunidade de desenvolvimento!).
- **Segurança Social com 2FA** obrigatório para empresas desde **12 de maio de 2026** (afeta comunicações do módulo Pessoal, mas o técnico deve conhecer).

### 6.7 RGPD

- Aviso legal configurável e registo do tratamento de dados; direito ao esquecimento (anonimização/processamento de dados pessoais); histórico de utilizadores; log de atividade (Enterprise). Artigos oficiais: "RGPD: Como o PHC CS o ajuda a cumprir a legislação".

---

## 7. Desenvolvimento e personalização (Framework PHC)

> Aqui está o coração do "técnico que desenvolve soluções". A plataforma tem **duas frameworks**: desktop (**Xbase**) e web (**C#**), mais a camada **SQL Server** (T-SQL) e a plataforma de integração **EyePeak**.

### 7.1 Princípios

- **Tudo o que é personalização fica gravado na base de dados** (código, regras, campos, ecrãs) — sobrevive a reinstalações do executável, mas **tem de ser validado a cada upgrade de versão**.
- As ferramentas da framework ativam-se por **parâmetros** (ex.: "Utiliza campos do utilizador?") e aparecem no menu **Supervisor → Framework PHC**.
- A disponibilidade depende da **gama/plano** (Corporate tem pouco; Advanced abre a personalização; Enterprise abre páginas/objetos/eventos completos e aprovações).

### 7.2 Ferramentas da Framework desktop (inventário completo)

| Ferramenta                                                     | Para que serve                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Campos de Utilizador**                                       | Adicionar colunas a tabelas do software (com tipos, validações) sem alterar o core                                                                                                                                                                                                                                  |
| **Tabelas de Utilizador**                                      | Criar tabelas novas da aplicação (ex.: a "Zona" do cliente é um campo de tabela do utilizador)                                                                                                                                                                                                                      |
| **Índices de Utilizador**                                      | Criar índices SQL sobre tabelas do software (incl. INCLUDED COLUMNS) para performance                                                                                                                                                                                                                               |
| **Valores por Defeito**                                        | Preenchimento automático de qualquer campo de qualquer tabela (com expressão)                                                                                                                                                                                                                                       |
| **Regras de Utilizador** (+ Assistente)                        | Validações de negócio: obrigar campos, impedir gravação sem stock, validar NIF… com editor e assistente de construção                                                                                                                                                                                               |
| **Teclas de Utilizador**                                       | Atalhos de teclado personalizados (com descrição em rodapé)                                                                                                                                                                                                                                                         |
| **Funções de Utilizador**                                      | Funções Xbase reutilizáveis criadas pelo utilizador                                                                                                                                                                                                                                                                 |
| **Instruções Internas**                                        | Instruções/procedimentos escritos pelo utilizador associados a cada ecrã principal (documentação in-app e automação)                                                                                                                                                                                                |
| **Eventos de Utilizador**                                      | Código Xbase associado a eventos de objetos/ecrãs (ver 7.3)                                                                                                                                                                                                                                                         |
| **Páginas de Utilizador / Objetos de Ecrã**                    | Acrescentar páginas (separadores) e objetos (campos, textos, botões, grelhas, campos de ligação, campos em árvore…) aos ecrãs standard                                                                                                                                                                              |
| **Ecrãs Personalizados (IDU)**                                 | Criar ecrãs novos de raiz (desenhador de ecrãs; em POS touch com drag-and-drop), com ligações entre IDUs, parâmetros de ecrã e botão personalizável                                                                                                                                                                 |
| **Opções de Ecrã / Menus**                                     | Acrescentar botões às toolbars e criar menus para opções novas; Configurações de Menus                                                                                                                                                                                                                              |
| **Consultas / Análises de Utilizador**                         | Consultas SQL do utilizador apresentadas como ecrãs de análise; base das Análises Multidimensionais                                                                                                                                                                                                                 |
| **Snapshots**                                                  | Consultas T-SQL "fotografadas" com variáveis (ex.: `#stamp#`), agrupáveis e coloridas                                                                                                                                                                                                                               |
| **Monitores / Itens de Monitor**                               | Apresentações de dados sequenciais (colunas configuráveis) para operational dashboards                                                                                                                                                                                                                              |
| **Alertas de Utilizador / Notificações**                       | Alertas automáticos (funções internas como `CriaAvs(stamp, userAv, …)`; novas funções internas 202601: "Enviar documentos de Compras/Vendas para o SII"); aviso interno, PHC Notify, e-mail                                                                                                                         |
| **Filtros de Utilizador**                                      | Filtros próprios para as tabelas/grelhas                                                                                                                                                                                                                                                                            |
| **Templates (Básicos / de Tabela) / Definição de Assinaturas** | Modelos rápidos de UI e assinaturas digitais em ecrãs (intervenções, faturas, dossiers)                                                                                                                                                                                                                             |
| **Multi-língua**                                               | Traduções de descrições (artigos, etc.)                                                                                                                                                                                                                                                                             |
| **Importação/Exportação**                                      | Importar Excel para linhas, exportar listagens xlsx/pdf, importação de câmbios via ODBC                                                                                                                                                                                                                             |
| **Dicionário de Dados**                                        | Consulta da estrutura de **qualquer tabela** (campos, descrições, tipos, tamanhos) e **relações entre tabelas** (desde a versão 2008) — acessível por Supervisor → Tratamento da base de dados, ou pelo menu de opções de qualquer ecrã (posiciona-se na tabela do ecrã). **A ferramenta nº 1 do programador PHC.** |
| **Simulador de SQL / Explorador de Dados**                     | Executar consultas à BD dentro da aplicação; explorar dados                                                                                                                                                                                                                                                         |
| **Análise Interna**                                            | Onde ficam gravados os **erros de execução dos eventos/código do utilizador** (linha do erro; expressões não têm nº de linha) — primeiro sítio a ver quando "o evento não faz nada"                                                                                                                                 |

### 7.3 Eventos e o objeto `ObjRecebido` (Xbase desktop)

Os eventos são expressões/programas em **Xbase** (sintaxe tipo Visual FoxPro) associados a objetos (Enterprise; alguns eventos de utilizador disponíveis desde Advanced). Lista oficial de eventos:

- **Init**, **Ativar**, **Desativar**, **Refrescar**
- **Clique**, **Duplo Clique**, **Clique Direito**
- **Ao Entrar**, **Ao Sair**, **Após Atualizar**, **Após não Atualizado**
- **Antes mudar Linha/Coluna**, **Depois mudar Linha/Coluna**
- **MouseEnter**, **MouseLeave**, **MouseMove**, **MouseWheel**
- **Tecla Pressionada**

Em cada evento programado existe o objeto **`ObjRecebido`**, com:

- **`ObjRecebido.Janela`** — apontador para o ecrã (ex.: `ObjRecebido.Janela.Caption = "Exemplo"`; alterações não persistem — usar no evento Init para aplicar sempre).
- **`ObjRecebido.Objecto`** — apontador para o próprio objeto (propriedades `Value`, `Parent`; em objetos compostos como o **Campo de Ligação**: `.Lista1`, `.Nossocampo1`, `.Procura`).
- **`ObjRecebido.Objecto.MeusDados`** — repositório chave/valor do utilizador para passar dados entre eventos: `AddParametro`, `GuardaParametro`, `ExisteParametro`, `GetNomeParametro`, `GetIndexParametro`, `TotalParametros` (leitura do valor: `MeusDados.CorFundoAntiga`).
- **`Return .F.`** — cancela o comportamento de raiz do objeto para esse evento (ex.: impedir digitação, esconder calendário em campos de data). Sem `Return` em expressões simples (o valor é retornado automaticamente).
- Debug: erros de eventos gravados na **Análise Interna**.

**Exemplo (guardar/repôr cor de fundo entre eventos):**

```xbase
* Evento Init (programa)
ObjRecebido.Objecto.MeusDados.GuardaParametro("CorFundoAntiga", ObjRecebido.Objecto.BackColor)
ObjRecebido.Objecto.BackColor = RGB(0,255,255)
```

**Funções internas úteis (exemplos documentados):** `U_NAVEGA` (navegar para registos/ecrãs; o 2º parâmetro interage com "mostrar último registo"), `CriaAvs` (criar avisos/avisos internos a utilizadores — parâmetros incluem `stamp` do ecrã e `userAv`), funções de envio SII (202601), `PromptFunction()` (202601 — nova função da framework para invocar IA/Cegid Pulse a partir de código; base dos **Smart Tools** que os parceiros podem configurar/monetizar).

### 7.4 Framework PHC CS Web (C#)

No lado web (incluído no Evolution), a framework oferece (lista oficial do manual "Framework PHC CS Web"):

- **Editor de Código** (C#) para eventos e regras
- **Eventos** (ex.: enviar e-mail com o material quando alguém introduz uma encomenda)
- **Regras** (validações de negócio: obrigar campos, impedir gravação sem stock…)
- **Ecrãs de Utilizador** (novos ecrãs à medida), **Objetos de Ecrã** (acrescentar campos a páginas existentes), **Objetos Internos** (campos novos em objetos existentes), **Objetos da Framework** (lista de todos os objetos do ecrã)
- **Opções de Ecrã** (botões novos em toolbars), **Menus**
- **Scripts** (programa executado por URL — endpoints próprios!)
- **Monitores** e **Itens de Monitor**, **Templates Básicos**, **Templates de Tabela**, **Definição de Assinaturas**
- **Valores por Defeito**, **Filtros do Utilizador**, **RSS do Utilizador**
- **Parâmetros** (configuração das aplicações autorizadas)
- **Log de Código** (diagnóstico da execução do código de utilizador)
- **Dicionário de dados** (web)

Relatórios web usam **DevExpress** ("Relatórios DevExpress no PHC CS Web", cobrindo Gestão: Clientes, Faturação, Recibos de Adiantamento…).

### 7.5 Camada SQL Server (T-SQL)

- Consultas diretas para análises/snapshots/relatórios externos (com `WITH (NOLOCK)` para leituras, e atenção a `ref`/`stamp`).
- **Índices de utilizador** via framework (evitar criar índices "à mão" sem documentar).
- Views/procedures: possíveis, mas **a PHC atualiza o esquema entre versões** — nunca alterar tabelas/colunas do core; usar campos/tabelas de utilizador.
- **Desfragmentação** e manutenção (capítulo 3).

### 7.6 Receitas práticas (padrões que vai usar sempre)

1. **Validar NIF português ao gravar cliente** → Regra de utilizador no ecrã Clientes (com assistente ou código Xbase), mensagem via aviso.
2. **Impedir faturação sem stock** → Regra de utilizador no documento (gama Advanced+) ou evento Após Atualizar nas linhas.
3. **Campo extra "Nº de contrato" na fatura** → Campo de utilizador na tabela FT + arrastar para página de utilizador no ecrã + valor por defeito.
4. **Alerta de crédito excedido** → Alerta de utilizador/`CriaAvs` no evento de gravação do documento + PHC Notify por e-mail.
5. **Análise de vendas por zona** → Análise de utilizador (SQL com join FT×CL×CL2) + filtro de utilizador; na gama Advanced, promover a **Análise Multidimensional**.
6. **Endpoint para loja online ler stock** → PHC CS Web: **Script** por URL + (ou) sincronização **EyePeak**.
7. **Assistente de IA para comerciais** → Cegid Pulse: configurar assistente de negócio / Smart Tool com `PromptFunction()` (202601).

### 7.7 Boas práticas de desenvolvimento PHC

- Trabalhar sempre sobre **clone da BD** (detach/copy/attach) antes de personalizar em produção.
- **Documentar cada personalização** (onde, código, motivo, versão) — os upgrades anuais obrigam a revalidar.
- Usar **Dicionário de Dados** para descobrir tabelas/relações em vez de adivinhar nomes.
- Respeitar `stamp`/concorrência otimista nas atualizações por SQL; preferir a API de gravação da aplicação quando possível.
- Verificar a **Análise Interna** (desktop) / **Log de Código** (web) após cada alteração.
- Não tocar em objetos certificados/fiscais sem validar SAF-T depois.
- Manter convenção de nomes nas entidades de utilizador (prefixo do parceiro/projeto).

---

## 8. Base de dados: estrutura e boas práticas

### 8.1 Convenções confirmadas

- **SQL Server** exclusivo (termos de licenciamento: 2008R2+; instalação típica: 2012+; Express no Corporate).
- **Nomes de tabelas curtos (2 letras)** + variantes numeradas para extensões:
  - `CL` = Clientes; `CL2` = Clientes – Outros Dados (ex.: país da morada)
  - `FT` = Documentos de Faturação (ex.: `ft.ndoc` = tipo de documento)
  - `BO` = Dossiers Internos
  - `RE` = Recibos
  - `TABOP` = Ordens de Fabrico (Manufactor)
  - (as restantes — fornecedores, artigos/stocks, movimentos, C/C, tesouraria, pagamentos, compras — descobrem-se com o **Dicionário de Dados**, que mostra campos, descrições, tipos e relações de qualquer tabela, ex.: pesquisar "clientes" ou ".CL")
- Campos estruturais recorrentes: **`ref`** (identificador do registo), **`stamp`** (versão/concorrência do registo — usado em snapshots com `#stamp#` e em navegação), `ndoc`/séries em documentos.
- Leituras pesadas com `WITH (NOLOCK)` (prática comum nas análises/snapshots documentados pela PHC).

### 8.2 O Dicionário de Dados é o seu melhor amigo

Disponível **em todas as gamas**: Supervisor → Tratamento da base de dados → Dicionário de dados (ou menu de opções de qualquer ecrã, ficando posicionado na tabela do ecrã). Mostra: campos, descrições, tipos, tamanhos e, desde a versão 2008, as **expressões de relação entre tabelas** (duplo clique numa ligação salta para a tabela relacionada). Use-o para mapear qualquer processo antes de escrever SQL.

### 8.3 Dados por empresa e ciclo de vida

- 1 empresa = 1 BD; multiempresa = multiplas BDs no mesmo servidor.
- **Arquivo**: passagem de dados antigos para BD de arquivo (performance + redução do tamanho contratado nos planos 10 GB).
- **File Storage**: anexos fora da BD (diretoria física) exceto fiscalmente relevantes.

---

## 9. Integrações e ecossistema

| Integração                              | O que faz                                                                                                                                                         | Como se configura                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **EyePeak**                             | Plataforma logística/WMS/e-commerce (Cegid Primavera). Fluxos documentais ERP↔EyePeak (ex.: encomendas de fornecedor → guias; séries de faturação sincronizadas)  | Monitor **EyePeak Sincronização** no menu Supervisor (desktop) / ecrã Eye Peak Sincronização (web)                   |
| **PHC CS Web / Front Web**              | Aplicações web sobre a mesma BD: Gestão Web (faturação, adiantamentos, recibos…), Front Web (extranet para clientes/fornecedores consultarem documentos/dossiers) | Package PHC CS Web; servidor IIS; utilizadores do desktop têm acesso                                                 |
| **SaphetyDoc / Documentos Eletrónicos** | Faturação eletrónica (EDI, CIUS-PT) por webservice; código EAN da empresa                                                                                         | Módulo Documentos Eletrónicos + artigo oficial de configuração                                                       |
| **Cegid Docs**                          | Arquivo digital legal na cloud; faturas CIUS-PT anexadas em PDF e pré-lançadas; pesquisa na WebApp (Evolution)                                                    | Configuração "Arquivo Digital Legal com Cegid Docs" (artigo oficial + FAQs)                                          |
| **Open Banking**                        | Importação de movimentos bancários, reconciliação e previsão de tesouraria (Evolution)                                                                            | Ativação no plano Evolution; configuração de contas                                                                  |
| **SEPA / bancos**                       | Ficheiros de débitos diretos e pagamentos; transferências de vencimentos; WebBanking                                                                              | Ecrãs de tesouraria/bancos + artigos oficiais                                                                        |
| **Multibanco / Unicre / PayPal**        | Referências MB, pagamentos online (web)                                                                                                                           | Módulos/parâmetros próprios                                                                                          |
| **SMS / e-mail (SMTP)**                 | Envio de documentos e avisos (código AT ao motorista, documentos por e-mail com idioma do cliente)                                                                | Módulo SMS; parâmetros de envio de e-mail diretos por SMTP                                                           |
| **TPA / POS / PDA**                     | Terminais de pagamento, postos de retalho, terminais portáteis de stock                                                                                           | Ligações/configuração POS e Stocks                                                                                   |
| **Excel / ODBC**                        | Importação (câmbios via ODBC, Excel para linhas), exportação (xlsx/pdf)                                                                                           | Nativo                                                                                                               |
| **Comunidade XML/B2B**                  | Troca de documentos cliente-fornecedor em XML (eProcurement) — histórico da plataforma                                                                            | Documentação da Comunidade                                                                                           |
| **Cegid Pulse (IA)**                    | Assistentes de negócio (comercial), Smart Tools configuráveis pelos parceiros, `PromptFunction()`                                                                 | Módulo Cegid Pulse + Cegid Account por utilizador (3 passos: acesso ao módulo, ativar Cegid Account na ficha, login) |
| **Segurança Social Direta / AT**        | Comunicações oficiais (webservice AT, SSD com 2FA desde 05/2026)                                                                                                  | Parâmetros + credenciais                                                                                             |

---

## 10. Operação, suporte, diagnóstico e performance

### 10.1 Diagnóstico (por onde começar quando algo falha)

1. **Análise Interna** — erros de eventos/código Xbase do utilizador.
2. **Log de Código** (web) e **Log de atividade** (Enterprise v30+: quem consultou/alterou/apagou).
3. **Histórico de utilizadores** e tracking de ações.
4. **Simulador de SQL / Explorador de dados** — validar dados diretamente.
5. Monitor de ligação ao SQL (quebras de rede), estado do ODBC.
6. Documentos "não processados" → verificar **processamento assíncrono**.
7. Impressões bloqueadas → séries sem **código de validação AT** (ATCUD).
8. SAF-T inválido → motivos de isenção fora de M01–M99 com webservice ativo; tipos de documento mal mapeados na série.

### 10.2 Performance

- Ecrãs em memória; desligar "mostrar último registo ao arrancar";
- Índices de utilizador (INCLUDED COLUMNS) para as consultas mais usadas;
- Desfragmentação das tabelas principais + manutenção SQL;
- BD de arquivo para históricos; File Storage para anexos;
- NOLOCK em leituras analíticas; snapshots bem desenhados;
- Monitorizar espaço da BD (limites de plano).

### 10.3 Upgrades e migrações

- Upgrade de versão: backup → ambiente de teste (clone) → upgrade → validar personalizações (campos, regras, eventos, análises, templates de impressão, integrações) → agendar produção.
- Migração **PHC CS perpétuo → Cegid PHC Evolution**: diagnóstico, plano (escolher plano/módulos), migração técnica (dados, configurações, integrações), suporte pós-arranque — é o processo standard dos parceiros; desenvolvimentos/addons existentes mantêm-se.

---

## 11. Formação, certificação e recursos oficiais

### 11.1 O que existe oficialmente

| Recurso                                                | O que é                                                                                                                                                                                                                                                                                                                                                                                                     | Acesso                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Help Center (helpcenter.phccs.net / phc.pt/portal)** | Manuais completos (Gestão, Stocks, Faturação, Framework, Web…), artigos "como fazer", Novidades por versão                                                                                                                                                                                                                                                                                                  | **Público**                                   |
| **Manuais dentro da aplicação**                        | Botão "Ajuda" em cada ecrã — manuais atualizados com novas funcionalidades                                                                                                                                                                                                                                                                                                                                  | Instalado                                     |
| **Comunidade PHC (community.phcsoftware.com)**         | Área técnica e comercial: notícias, ficheiros, downloads, documentação de parceiro                                                                                                                                                                                                                                                                                                                          | Login **Nº Cliente + ID Técnico + password**  |
| **PHC On (on.phc.pt)**                                 | Formação online, autoformação em vídeo, truques e dicas, novidades, Calendário PHC de obrigações legais                                                                                                                                                                                                                                                                                                     | Acordo PHC On                                 |
| **Cegid Academy — PEP (Cegid PHC Evolution Program)**  | Programa intensivo prático de **140 h**, online pós-laboral (edição com início a 17 de setembro; 1.650 € + IVA, pagamento faseado): configurar/administrar software e ambientes técnicos, BD e SQL (performance e segurança), processos e módulos do ERP (gestão, tesouraria, contabilidade, vencimentos). Certificação oficial Cegid PHC; os primeiros certificados podem integrar projetos do ecossistema | Inscrição via phcsoftware.com/pt/formacao-pep |
| **Certificações PHC (histórico/atuais)**               | Certificação PHC CS Desktop Corporate/Advanced/Enterprise + por módulos; "bolsa de técnicos certificados"; pré-requisito para níveis de parceiro                                                                                                                                                                                                                                                            | Via parceiro/Cegid                            |
| **Microcredenciação IPT**                              | Curso académico "Software Cegid PHC CS Advanced" (Instituto Politécnico de Tomar)                                                                                                                                                                                                                                                                                                                           | portal2.ipt.pt                                |
| **PHC Hi, Tech**                                       | Formação de 3 meses (híbrida) para entrada na carreira (ex.: Angola)                                                                                                                                                                                                                                                                                                                                        | phcsoftware.com/ao                            |
| **Eventos de programadores**                           | "Coding PHC" (evento anual de developers das frameworks) e histórico DevSummit                                                                                                                                                                                                                                                                                                                              | Comunidade/site                               |
| **YouTube (@SoftwarePHC) e blog**                      | Vídeos de produto, webinars, artigos                                                                                                                                                                                                                                                                                                                                                                        | Público                                       |
| **Listagens de Novidades (PDF)**                       | Por versão (v18…v30, 202501, 202601…) — os parceiros publicam (Arentia, Winsig, NSoft…)                                                                                                                                                                                                                                                                                                                     | Público                                       |
| **Programa de Parceiros**                              | Venda/implementação exclusivamente via parceiros certificados (com especializações setoriais); acesso a demos, NFR, formação contínua                                                                                                                                                                                                                                                                       | phcsoftware.com/pt/parceiros                  |

### 11.2 O programa oficial da Certificação PHC CS Desktop Advanced (o currículo do expert)

Resumo fiel do conteúdo programático oficial — use-o como índice de estudo:

1. **Plataforma client/server**: características da BD e performance; limites de GB; instalação (SQL Express; requisitos mínimos; HCL); passos de instalação; utilizadores/logins SQL; detach/attach; segurança; backups e recuperação.
2. **Instalação do PHC Desktop**: exe único; instalação + attach + ODBC automático; utilizadores e grupos; acessos; toolbars; barra de status estendida; barra de janelas; ecrãs em memória; ecrãs personalizados; campos obrigatórios; análise multidimensional; BD de arquivo; **regras, campos de utilizador, valores por defeito e teclas de utilizador**; painel de ecrã; Enciclopédia PHC.
3. **Navegação**: organização de ecrãs e menus; lógica de funcionamento; mapas definidos e filtros.
4. **Gestão — ficheiros**: Clientes/Fornecedores (sede/estabelecimentos, tipos de desconto, condições de pagamento); Stocks e Serviços (referências alternativas, compostos, inventário físico, **PCMP**, promoções, tabelas de preços com validade).
5. **Gestão — circuito documental**: DI ↔ Faturas/Compras (encomendas de cliente/a fornecedor, comprar a encomenda, faturar a encomenda, cópias); tabela de códigos de C/C; códigos de tesouraria; códigos de movimentos de stock; configuração de documentos de faturação.
6. **Tesouraria**: contas, extratos, movimentos, títulos.
7. **Painel de bordo**: monitor de dívidas, saldo de C/C por idades, rankings, análises de DI.
8. **RGPD**: aviso legal, esquecimento, registo de tratamento.
9. **Dossiers especiais**: stock inicial, transferência de armazém, preços, avenças, composição/produção.
10. **PHC CS Web**: conceito, aplicações, Front Web e Gestão Web.
11. **Configuração de documentos** (conceitos, campos obrigatórios, grupos, acessos a reimprimir/totalizar/anexar, gráficos, "imprimir quando").
12. **Contabilidade**: conceitos, parâmetros, abertura de ano, contas, diários, **documentos pré-definidos (incl. na Gestão)**, movimentos, centros analíticos, apuramento IVA, declaração periódica, CEVMC, resultados, **integrações Gestão→Contabilidade (configuração + operação)**, mapas de gestão, BD pronta, PHC XL, taxonomia.
13. **Imobilizado** e **Pessoal** (visão geral operacional completa).
14. **POS** e **Suporte** (circuitos completos).
15. **Técnico**: instalação do software e do SQL Server; manutenção manual de BDs; **PHC ON**; **Framework PHC (3 partes)**; área técnica e comercial da **Comunidade PHC**.
16. **Implementing SQL** (labs) e preparação de demonstrações.

---

## 12. Plano de estudos até ao nível expert

### Fase 0 — Preparação (semana 1)

- [ ] Perceber o ecossistema (capítulo 1): Evolution vs. GO vs. CS; planos vs. gamas; módulos.
- [ ] Ler as **Novidades da versão atual** (202601) e das 2–3 anteriores no Help Center.
- [ ] Criar contas/marcadores: Help Center, phcsoftware.com, YouTube @SoftwarePHC, blog, Comunidade PHC (se tiver credenciais de parceiro/cliente).

### Fase 1 — Infraestrutura (semanas 2–3)

- [ ] Montar laboratório: VM Windows Server + SQL Server Express + instalação de demonstração do PHC (pedir a um parceiro ou usar licença NFR/eval da Cegid).
- [ ] Instalar, criar empresa de demo, fazer detach/attach, backup/restore, criar utilizadores/grupos/acessos.
- [ ] Atualizar o software; explorar o Supervisor e o Dicionário de Dados.

### Fase 2 — Domínio funcional do Gestão (semanas 4–7)

- [ ] Ficheiros: criar 20 clientes (com filiais, idiomas, zonas), 10 fornecedores, 50 artigos (famílias, unidades alternativas, compostos/kits, lotes), armazéns, tabelas de preços, descontos, condições/formas de pagamento, IVA.
- [ ] Vendas: configurar 5 séries (Fatura FT, Fatura Simplificada FS, Fatura-Recibo FR, Nota de Crédito NC, Guia tipo 4) e emitir o circuito completo: Orçamento → Encomenda → Guia (com comunicação de transporte simulada) → Fatura → Recibo → liquidação. Testar adiantamentos, retenção IRS, isenções (M08…), vendas a dinheiro, emissão automática.
- [ ] Compras: encomenda a fornecedor → receção → fatura de compra → pagamento com aprovação; adiantamentos.
- [ ] Stocks: movimentos, transferência entre armazéns (dossier), contagem/inventário com acertos, análise de ruturas/máx-mín, PCMP e valor de stock.
- [ ] Tesouraria: contas, extrato, reconciliação, transferências, títulos, previsões; SEPA e referências MB (teórico).
- [ ] C/C: aging, mailing, monitor de dívidas, incobráveis.
- [ ] Análises: mapas definidos, análises de utilizador (SQL), snapshot, ranking de vendas.

### Fase 3 — Fiscalidade (semanas 8–9)

- [ ] Exportar e validar **SAF-T (PT)** no validador da AT; inspecionar o XML (tipos de documento, motivos de isenção, MovementOfGoods).
- [ ] Simular o fluxo **ATCUD/QR**: comunicação de séries, código de validação, layouts, bloqueio de impressão.
- [ ] Configurar comunicação de documentos de transporte (webservice vs. SAF-T resumido) e SMS ao motorista.
- [ ] Rever artigos oficiais: e-fatura, faturação eletrónica/SaphetyDoc/CIUS-PT, inventário à AT, e-TaxFree, retenções, SDR 2026, RGPD.
- [ ] Integração com Contabilidade: documentos pré-definidos, contas de integração, apuramento de IVA (lançar um mês completo).

### Fase 4 — Desenvolvimento (semanas 10–14)

- [ ] Estudar **Xbase/VFP** (sintaxe: comandos, cursores, funções) e **T-SQL**.
- [ ] Framework desktop, por ordem: valores por defeito → campos de utilizador → regras (assistente e código) → teclas → funções de utilizador → alertas → instruções internas.
- [ ] Eventos: implementar os padrões do §7.6 (1–4) num clone; depurar com a Análise Interna; usar `ObjRecebido` completo (Janela, Objecto, MeusDados, Return .F.).
- [ ] Páginas/objetos de utilizador e **IDUs**: construir um ecrã novo (ex.: "Crédito do Cliente" com dados de C/C + botões de ação) e ligá-lo a um menu.
- [ ] Análises multidimensionais + snapshots com `#stamp#`; monitores.
- [ ] Índices de utilizador para otimizar as suas consultas; medir antes/depois.
- [ ] Framework **Web (C#)**: editor de código, eventos, regras, **scripts por URL** (criar um endpoint de teste), monitores, templates.
- [ ] **EyePeak**: configurar o monitor de sincronização; desenhar um fluxo encomenda→guia.
- [ ] **Cegid Pulse**: ativar (3 passos), explorar o assistente comercial, desenhar uma Smart Tool com `PromptFunction()`.

### Fase 5 — Nível consultor/expert (semanas 15+)

- [ ] Fazer o **PEP (Cegid Academy)** ou a certificação PHC equivalente; entrar na bolsa de técnicos certificados.
- [ ] Implementar um ciclo completo num cliente real (ou demo avançada): diagnóstico → desenho → configuração → migração de dados (importação Excel/ODBC) → formação → arranque → pós-arranque.
- [ ] Dominar upgrades: fazer upgrade de versão ao laboratório validando todas as personalizações.
- [ ] Especializar-se num vertical (retalho/POS, distribuição/logística com EyePeak, serviços/suporte, manufatura) — é onde os parceiros monetizam.
- [ ] Acompanhar cada nova versão (202602…) e o Calendário PHC de obrigações.

### Hábitos do expert

- Ler o **manual in-app** de cada ecrã antes de responder a um ticket (a PHC documenta campo a campo).
- Usar o **Dicionário de Dados** para tudo o que envolva SQL.
- Testar sempre em **clone** antes de produção.
- Documentar personalizações num registo vivo (o upgrade anual agradece).
- Participar na **Comunidade PHC** e nos eventos **Coding PHC**.

---

## 13. Checklists de autoavaliação

**Funcional (Gestão)** — sabe fazer sem consultar?

- [ ] Criar/configurar séries e tipos de documento e explicar o mapping SAF-T
- [ ] Circuito completo venda (orçamento→fatura→recibo→liquidação) e compra
- [ ] Inventário físico com acertos e valorização PCMP
- [ ] Aging, mailing e monitor de cobranças
- [ ] Tesouraria real/previsional/orçamental e reconciliação
- [ ] Integração Gestão→Contabilidade (documentos pré-definidos, IVA)

**Configuração**

- [ ] Parâmetros gerais e de faturação (os ~20 mais usados)
- [ ] Utilizadores/grupos/perfis e acessos por operação
- [ ] Layouts de impressão com QR/ATCUD
- [ ] RGPD (aviso legal, esquecimento)

**Fiscal**

- [ ] SAF-T faturação + transporte (webservice e resumido)
- [ ] ATCUD: comunicação de séries e código de validação
- [ ] Motivos de isenção M01–M99 e impacto do webservice
- [ ] Retenções IRS/Imposto Selo; inventário à AT; SDR 2026

**Desenvolvimento**

- [ ] Escrever um evento Xbase com ObjRecebido e Return .F.
- [ ] Criar campo/tabela/índice/regra de utilizador
- [ ] Construir um IDU e ligá-lo a um menu
- [ ] Análise de utilizador + snapshot + análise multidimensional
- [ ] Script web C# por URL; monitores
- [ ] Sincronização EyePeak; PromptFunction/Cegid Pulse

**Operação**

- [ ] Instalar do zero (SQL + PHC + ODBC + licenças)
- [ ] Backup/restore, detach/attach, BD de arquivo
- [ ] Diagnosticar com Análise Interna / Log de Código / log de atividade
- [ ] Upgrade de versão com validação de personalizações
- [ ] Plano de performance (índices, desfragmentação, parâmetros)

---

## 14. Glossário PHC

| Termo                          | Significado                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| **Cegid PHC Evolution**        | ERP desktop+web sucessor do PHC CS (subscrição)                                        |
| **PHC CS**                     | Nome histórico da plataforma (Client/Server)                                           |
| **Gamas**                      | Corporate / Advanced / Enterprise (níveis funcionais)                                  |
| **Planos**                     | Standard / Plus / Advanced / Premium / Ultimate (subscrição Evolution)                 |
| **DI / Dossier Interno**       | Documento interno parametrizável (orçamentos, encomendas, folhas de obra…) — tabela BO |
| **FT**                         | Documentos de Faturação (tabela)                                                       |
| **CL / CL2**                   | Clientes / Clientes-Outros Dados (tabelas)                                             |
| **RE**                         | Recibos (tabela)                                                                       |
| **ref / stamp**                | Identificador do registo / campo de versão-concorrência                                |
| **Xbase**                      | Linguagem de personalização desktop (sintaxe VFP)                                      |
| **ObjRecebido**                | Objeto disponível nos eventos (Janela, Objecto, MeusDados)                             |
| **IDU / Ecrãs Personalizados** | Ecrãs desenhados pelo utilizador                                                       |
| **Framework PHC**              | Conjunto de ferramentas de personalização (desktop e web)                              |
| **Supervisor**                 | Menu de administração (framework, tratamento da BD, monitores)                         |
| **PHC On**                     | Acordo anual de atualizações + portal de formação/Calendário PHC                       |
| **Comunidade PHC**             | Portal de parceiros/clientes (login Nº Cliente + ID Técnico)                           |
| **Help Center**                | Manuais e artigos públicos (helpcenter.phccs.net)                                      |
| **Dicionário de Dados**        | Consulta da estrutura/relações de todas as tabelas                                     |
| **Análise Interna**            | Log de erros do código de utilizador (desktop)                                         |
| **SAF-T (PT)**                 | Ficheiro de auditoria fiscal normalizado (faturação, transporte, inventário)           |
| **ATCUD**                      | Código único do documento (validação de série + sequencial)                            |
| **e-Fatura**                   | Comunicação de faturas à AT (webservice ou SAF-T)                                      |
| **CIUS-PT**                    | Especificação portuguesa de faturação eletrónica (setor público)                       |
| **SII / TicketBAI**            | Regimes fiscais de Espanha                                                             |
| **SDR**                        | Sistema de Depósito e Recolha de embalagens (2026)                                     |
| **PCMP**                       | Preço de Custo Médio Ponderado (custeio de stock)                                      |
| **C/C**                        | Conta corrente                                                                         |
| **CEVMC**                      | Custo das Existências Vendidas e das Mercadorias Consumidas                            |
| **XL**                         | Componente para grandes volumes/centros analíticos (PHC XL)                            |
| **EyePeak**                    | Plataforma de logística/e-commerce que sincroniza com o PHC                            |
| **Cegid Pulse**                | Ecossistema de IA no ERP (assistente Cris, Smart Tools, PromptFunction)                |
| **Cegid Docs**                 | Gestão documental/arquivo digital legal na cloud                                       |
| **PEP**                        | Cegid PHC Evolution Program (formação/certificação de 140 h da Cegid Academy)          |
| **Snapshots**                  | Consultas T-SQL guardadas com variáveis (ex.: #stamp#)                                 |
| **Monitores**                  | Apresentações sequenciais de dados operacionais                                        |
| **Front Web**                  | Extranet web para clientes/fornecedores                                                |
| **Avenças**                    | Dossier de faturação recorrente                                                        |
| **Rappel**                     | Desconto de volume retroativo (cliente/fornecedor)                                     |
| **Ignios**                     | Serviço de preenchimento automático de dados de empresa por NIF                        |

---

## 15. Fontes e links de referência

**Oficiais (públicos)**

- Site Cegid PHC: https://phcsoftware.com/pt — produtos: `/pt/cegid-phc-cs`, `/pt/cegid-phc-evolution`, módulo Gestão: `/pt/modulos/phc-cs/phc-cs-modulo-phc-cs-gestao`
- **Help Center Cegid PHC CS/Evolution**: https://helpcenter.phccs.net e http://phc.pt/portal (manuais SUG, artigos iDirecto, Novidades)
  - Novidades da versão (índice): https://www.phc.pt/portal/programs/ewpview.aspx?codigo=pncs&geo=pt&lang=pt-pt
  - Manual "Eventos" (Xbase/ObjRecebido): http://phc.pt/portal/sug/ptxview.aspx?ptxid=20345536
  - Manual "Constituição da Tabela de Clientes": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?ptxid=20344844
  - Manual "Documentos de Faturação": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?ptxid=20346102
  - "Framework PHC CS Web": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?ptxid=20368282
  - "O que é o PHC ON": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?ptxid=20346837
  - "Dicionário de Dados" (iDirecto): https://www.phc.pt/portal/programs/ewpview.aspx?codigo=IDIR070905
  - "Faturas com código QR e ATCUD": https://www.phc.pt/portal/programs/ewpview.aspx?codigo=IDIR201007
  - "Comunicação de Documentos de Transporte à AT via SAF-T": https://www.phcsoftware.com/pt/artigo/a-comunicacao-de-documentos-de-transporte-a-at-via-saf-t-esta-mais-simples
  - "Como configurar dossiers internos": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?stamp=bg91527ededbdgeb32c597
  - "Como sincronizar o ERP Cegid PHC Desktop com o EyePeak": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?stamp=!!!5fg%3Ae89ee1bc8gdc96357d
  - "Desenhar Ecrãs Personalizados": https://helpcenter.phccs.net/pt/sug/ptxview.aspx?ptxid=20370447
  - "PHC CS 202501: novidades" (File Storage, Cris/GenAI, descontos web): https://phcsoftware.com/pt/artigo/phcs-cs-novidades-transformar-gestao-2025
- **Comunidade PHC** (login técnico): https://community.phcsoftware.com
- **Formação PEP / Cegid Academy**: https://phcsoftware.com/pt/formacao-pep e https://pt.primaverabss.com/pt/pagina/academy-pep/
- Programa oficial "Certificação PHC CS Desktop Advanced" (PDF): http://www.phc.pt/enews/Conte%C3%BAdo%20Program%C3%A1tico%20Certifica%C3%A7%C3%A3o%20PHC%20CS%20Desktop%20Advanced.pdf
- Termos de licenciamento (SQL Server 2008R2+): https://phcsoftware.com/pt/phc-cs/termos-e-condicoes-de-licenciamento-utlizacao-phc-cs
- Parceiros: https://phcsoftware.com/pt/parceiros | Diretoria de parceiros certificados: https://www.phc.pt/portal/programs/ewpview.aspx?codigo=dirpcsx1239
- Microcredenciação IPT "Software Cegid PHC CS Advanced": https://portal2.ipt.pt/pt/cursos/microcredenciacao/Mc_-_SCPHCCSA/

**Parceiros (PDFs públicos úteis)**

- Brochura PHC Gestão CS (âmbito funcional): https://web.trimatriz.com/SITE_12/UserFiles/Downloads/PHCGestao.pdf
- Diferenças entre gamas Corporate vs Advanced (v28): https://www.absinformatica.pt/uploads/cms/20210204173610_Diferencas_entre_Corporate_e_Advanced_PT.pdf
- Novidades PHC CS v18/v19/v27 (Arentia/phc.pt): https://www.arentia.pt/api/backoffice/library/get?r=/&d=PDFs&f=Listagem_de_Novidades_v18&e=.pdf | http://www.phc.pt/enews/Listagem_de_Novidades_v19.pdf | http://www.phc.pt/enews/Listagem_Novidades_27.pdf
- Descritivo PHC CS Web: https://microvesa.pt/wp-content/uploads/2020/06/Descritivo_PHC_CS_Web-completo.pdf
- Manual de Instalação PHC CS Desktop (Scribd): https://pt.scribd.com/document/485370769/Manual-de-Instalacao-PHC-CS-Desktop
- Análise GO vs Evolution (Sisgarbe, 08/2026): https://sisgarbe.pt/como-escolher-entre-cegid-phc-go-cegid-phc-evolution/
- Totalsoft — Cegid PHC Evolution (planos/migração): https://totalsoft.pt/landing-page-totalsoft/cegid-phc-evolution.html

---

_Guia compilado em 2026-09-15 a partir de fontes oficiais Cegid PHC e documentação pública de parceiros. Os detalhes finos (listas exatas de parâmetros/campos por versão e gama) devem ser confirmados no Help Center da versão instalada e nos manuais in-app, que são a fonte primária e estão sempre atualizados._
