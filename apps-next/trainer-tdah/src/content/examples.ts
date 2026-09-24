import type { CodeExample } from "./types";

/**
 * Exemplos práticos de código — formato "exemplo resolvido" (worked example):
 * problema real → versão frágil (e porquê) → versão correta (e porquê) → como verificar.
 *
 * Base pedagógica: o "worked example effect" (Sweller & Cooper, 1985; Atkinson et al., 2000)
 * mostra que principiantes aprendem mais depressa a estudar exemplos resolvidos do que
 * a resolver problemas do zero — reduz a carga cognitiva, o que é especialmente útil com TDAH.
 *
 * Nomes de tabelas/campos PHC usados (ft, cl, st, fdata, ndoc, etotal, anulado, ncont, stmin…)
 * vêm do schema.json do repositório original. A autoridade final é SEMPRE o Dicionário de Dados
 * da instalação — os campos variam por versão e por personalização.
 */
export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: "sql-vendas-periodo",
    title: "Vendas por cliente num período (sem matar o índice)",
    missions: ["L05", "L41"],
    language: "sql",
    problem:
      "O diretor pede o total faturado por cliente no 1.º trimestre. A consulta tem de ser rápida numa BD com anos de faturação e não pode contar documentos anulados.",
    bad: {
      code: `SELECT *
FROM ft
WHERE YEAR(fdata) = 2025
  AND MONTH(fdata) <= 3`,
      why: [
        "YEAR()/MONTH() aplicadas à coluna impedem o SQL Server de usar um índice sobre fdata (predicado não 'sargable') — lê a tabela inteira.",
        "SELECT * traz dezenas de colunas que ninguém vai ler: mais I/O, mais rede, mais memória.",
        "Não exclui documentos anulados — o total fica errado.",
        "Não agrupa por cliente — devolve linhas soltas em vez da resposta pedida.",
      ],
    },
    good: {
      code: `DECLARE @ini date = '2025-01-01';
DECLARE @fim date = '2025-04-01';  -- limite EXCLUSIVO

SELECT ft.no          AS cliente_no,
       MAX(ft.nome)   AS cliente_nome,
       COUNT(*)       AS documentos,
       SUM(ft.etotal) AS total_eur
FROM ft
WHERE ft.fdata >= @ini
  AND ft.fdata <  @fim
  AND ft.anulado = 0
GROUP BY ft.no
ORDER BY total_eur DESC;`,
      why: [
        "Intervalo semiaberto (>= início e < fim) deixa a coluna 'limpa' → o índice pode ser usado, e não há erros com horas no último dia.",
        "Parâmetros (@ini/@fim) tornam a consulta reutilizável e evitam editar datas no meio do código.",
        "Só as colunas necessárias + GROUP BY dão exatamente a resposta pedida.",
        "anulado = 0 alinha o número com o que a contabilidade e o SAF-T mostram.",
      ],
    },
    verify: [
      "Compare o total com o mapa de vendas do PHC para o mesmo período (devem bater certo).",
      "Corra com SET STATISTICS IO ON antes e depois: as 'logical reads' devem descer.",
      "Confirme no Dicionário de Dados se na sua versão existe ft.nome e se as NC devem subtrair (tipo de documento).",
    ],
    sources: [
      { label: "Microsoft Learn — SQL Server index design guide (sargability)", url: "https://learn.microsoft.com/sql/relational-databases/sql-server-index-design-guide" },
      { label: "Microsoft Learn — SET STATISTICS IO", url: "https://learn.microsoft.com/sql/t-sql/statements/set-statistics-io-transact-sql" },
    ],
    caveat: "Notas de crédito têm etotal positivo em muitas configurações: se precisar de faturação líquida, filtre/subtraia pelo tipo de documento da sua instalação.",
  },
  {
    id: "sql-nif-duplicado",
    title: "Encontrar clientes com NIF duplicado (qualidade de dados)",
    missions: ["L06", "L41"],
    language: "sql",
    problem:
      "Há clientes criados duas vezes. Isso parte a conta corrente, os extratos e o SAF-T. Precisa de uma lista para limpar.",
    bad: {
      code: `SELECT nome, ncont
FROM cl
ORDER BY nome
-- e depois procurar duplicados "a olho"`,
      why: [
        "Depende da atenção visual numa lista longa — exatamente o tipo de tarefa em que qualquer pessoa (e mais ainda com TDAH) falha.",
        "Duplicados com nomes ligeiramente diferentes ('Lda' vs 'Lda.') ficam separados na ordenação.",
      ],
    },
    good: {
      code: `SELECT cl.ncont,
       COUNT(*)                   AS fichas,
       STRING_AGG(CAST(cl.no AS varchar(10)), ', ') AS numeros
FROM cl
WHERE LTRIM(RTRIM(cl.ncont)) <> ''
  AND cl.ncont <> '999999990'   -- NIF genérico de consumidor final
GROUP BY cl.ncont
HAVING COUNT(*) > 1
ORDER BY fichas DESC;`,
      why: [
        "Agrupa pela chave de negócio (NIF), não pelo nome — a máquina faz a comparação.",
        "Exclui NIF vazio e o NIF de consumidor final, que se repetem legitimamente.",
        "STRING_AGG (SQL Server 2017+) mostra logo os números a rever.",
        "Filiais (estab) do mesmo cliente partilham NIF — reveja antes de apagar.",
      ],
    },
    verify: [
      "Abra 2 dos números devolvidos no PHC e confirme que são mesmo o mesmo cliente.",
      "Nunca apague: inative e documente (há documentos fiscais ligados).",
    ],
    sources: [
      { label: "Microsoft Learn — STRING_AGG", url: "https://learn.microsoft.com/sql/t-sql/functions/string-agg-transact-sql" },
    ],
    caveat: "Em SQL Server anterior a 2017, remova a coluna STRING_AGG.",
  },
  {
    id: "sql-stock-minimo",
    title: "Artigos abaixo do stock mínimo (lista de compras)",
    missions: ["L27"],
    language: "sql",
    problem: "O armazém quer saber, todas as manhãs, o que encomendar.",
    bad: {
      code: `SELECT ref, design, stock, stmin
FROM st
WHERE stock < stmin`,
      why: [
        "Inclui artigos com stmin = 0 e stock negativo (serviços, artigos sem gestão de stock) — lista cheia de ruído.",
        "Sem ordenação por urgência: o mais crítico pode estar no fim.",
      ],
    },
    good: {
      code: `SELECT st.ref,
       st.design,
       st.stock,
       st.stmin,
       st.stmin - st.stock AS em_falta
FROM st
WHERE st.stmin > 0
  AND st.stock < st.stmin
ORDER BY em_falta DESC;`,
      why: [
        "stmin > 0 restringe aos artigos em que alguém definiu mínimo — sinal de que é gerido.",
        "A coluna calculada em_falta ordena por urgência e já é a quantidade a propor.",
      ],
    },
    verify: [
      "Escolha 1 artigo da lista e confira o stock na ficha do artigo.",
      "Se trabalha com vários armazéns, o stock por armazém está noutra tabela — confirme no Dicionário.",
    ],
    sources: [{ label: "Repositório original — schema.json (campos st.stock, st.stmin)", url: "https://github.com/brunoacidados/phc-trainer-pro" }],
  },
  {
    id: "sql-correcao-segura",
    title: "Corrigir dados com rede de segurança (transação + TRY/CATCH)",
    missions: ["L03", "L39", "L55"],
    language: "sql",
    problem:
      "Precisa de corrigir a zona de 40 clientes. Um UPDATE mal escrito pode alterar milhares de registos em produção.",
    bad: {
      code: `UPDATE cl SET zona = 'NORTE'
WHERE zona = 'NORT'`,
      why: [
        "Sem backup, sem transação e sem contagem prévia: se o WHERE estiver errado, não há volta atrás.",
        "Não confirma quantas linhas mudaram versus as esperadas.",
      ],
    },
    good: {
      code: `-- 0) Backup feito e testado (missão L03). Nunca salte este passo.
SET XACT_ABORT ON;  -- qualquer erro aborta e reverte a transação

-- 1) Ensaiar: quantos registos vão mudar?
SELECT COUNT(*) AS vao_mudar FROM cl WHERE zona = 'NORT';

BEGIN TRY
  BEGIN TRANSACTION;

  UPDATE cl SET zona = 'NORTE'
  WHERE zona = 'NORT';

  -- 2) Guarda: se não mudou o número esperado, desfaz
  IF @@ROWCOUNT <> 40
    THROW 50001, 'Número de linhas inesperado — nada foi alterado.', 1;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;  -- volta a lançar o erro original para o ver
END CATCH;`,
      why: [
        "Ensaiar com SELECT COUNT(*) antes de alterar = 'medir antes de cortar'.",
        "A guarda @@ROWCOUNT transforma a expectativa em verificação automática.",
        "TRY/CATCH + ROLLBACK garante 'tudo ou nada'; THROW sem argumentos preserva a mensagem original.",
        "XACT_ABORT ON cobre erros que o CATCH sozinho não apanha (ex.: timeouts do cliente).",
      ],
    },
    verify: [
      "Treine primeiro na empresa demo (missão L00).",
      "Mude o 40 para 39 e confirme que nada é alterado — teste a própria rede de segurança.",
      "Prefira sempre a interface do PHC ou as ferramentas do Supervisor quando existirem: o UPDATE direto ignora regras e eventos do software.",
    ],
    sources: [
      { label: "Microsoft Learn — TRY...CATCH (Transact-SQL)", url: "https://learn.microsoft.com/sql/t-sql/language-elements/try-catch-transact-sql" },
      { label: "Microsoft Learn — SET XACT_ABORT", url: "https://learn.microsoft.com/sql/t-sql/statements/set-xact-abort-transact-sql" },
      { label: "Erland Sommarskog — Error and Transaction Handling in SQL Server", url: "https://www.sommarskog.se/error_handling/Part1.html" },
    ],
    caveat: "Alterar tabelas do PHC diretamente pode violar regras do software e o suporte do parceiro. Use só em ambiente de treino ou com autorização expressa.",
  },
  {
    id: "sql-parametros-vs-concatenar",
    title: "Filtros com texto do utilizador: parâmetros, nunca concatenar",
    missions: ["L41", "L50"],
    language: "sql",
    problem: "Um relatório recebe o nome do cliente escrito pelo utilizador e filtra a tabela cl.",
    bad: {
      code: `DECLARE @nome nvarchar(100) = N'O''Brien';  -- texto do utilizador
DECLARE @sql nvarchar(max) =
  N'SELECT no, nome FROM cl WHERE nome LIKE ''%' + @nome + N'%''';
EXEC (@sql);`,
      why: [
        "Concatenar texto do utilizador em SQL dinâmico abre a porta a SQL injection (OWASP Top 10: A03 Injection).",
        "Um simples apóstrofo (O'Brien) já parte a consulta.",
      ],
    },
    good: {
      code: `DECLARE @nome nvarchar(100) = N'O''Brien';

EXEC sp_executesql
  N'SELECT no, nome FROM cl WHERE nome LIKE @padrao',
  N'@padrao nvarchar(102)',
  @padrao = N'%' + @nome + N'%';

-- Melhor ainda, quando não precisa de SQL dinâmico:
SELECT no, nome FROM cl WHERE nome LIKE N'%' + @nome + N'%';`,
      why: [
        "sp_executesql envia o valor como PARÂMETRO: é tratado como dado, nunca como código.",
        "Planos de execução reutilizáveis (bónus de performance).",
        "Regra simples para memorizar: 'dados vão em parâmetros, código vai no texto'.",
      ],
    },
    verify: [
      "Teste com os valores O'Brien e ' OR 1=1 -- : a consulta deve devolver 0 ou poucos resultados, nunca a tabela inteira.",
    ],
    sources: [
      { label: "OWASP — SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
      { label: "Microsoft Learn — sp_executesql", url: "https://learn.microsoft.com/sql/relational-databases/system-stored-procedures/sp-executesql-transact-sql" },
    ],
  },
  {
    id: "sql-medir-antes-otimizar",
    title: "Performance: medir antes e depois de criar um índice",
    missions: ["L49"],
    language: "sql",
    problem: "A análise de vendas por data demora 40 segundos. Alguém sugere 'pôr um índice'.",
    bad: {
      code: `-- "Acho que é disto"
CREATE INDEX ix1 ON ft (no);
CREATE INDEX ix2 ON ft (nmdoc);
CREATE INDEX ix3 ON ft (fdata);`,
      why: [
        "Índices por palpite: cada índice torna TODAS as gravações nessa tabela mais lentas.",
        "Sem medição, não sabe se melhorou, piorou ou ficou igual.",
        "Criados por fora do PHC, podem perder-se num upgrade.",
      ],
    },
    good: {
      code: `-- 1) Medir (antes)
SET STATISTICS IO, TIME ON;
SELECT fdata, no, etotal FROM ft
WHERE fdata >= '2025-01-01' AND fdata < '2025-02-01' AND anulado = 0;
-- anote: logical reads + elapsed time; veja o plano (Ctrl+M no SSMS)

-- 2) UM índice que cobre o filtro e as colunas lidas.
--    No PHC crie-o como "Índice de utilizador" (framework), não com DDL direto;
--    a definição equivalente é:
--    CREATE INDEX ix_ft_fdata ON ft (fdata) INCLUDE (no, etotal, anulado);

-- 3) Medir (depois) com a MESMA consulta e comparar.`,
      why: [
        "Otimização é medição: números antes/depois ('logical reads' e tempo).",
        "INCLUDE cobre a consulta e evita lookups à tabela.",
        "O Índice de utilizador do PHC sobrevive a upgrades (missão L49).",
      ],
    },
    verify: [
      "Registe na prova da missão: consulta, reads antes, reads depois, tempo antes, tempo depois.",
      "Verifique que as gravações de faturas não ficaram visivelmente mais lentas.",
    ],
    sources: [
      { label: "Microsoft Learn — Create indexes with included columns", url: "https://learn.microsoft.com/sql/relational-databases/indexes/create-indexes-with-included-columns" },
      { label: "Microsoft Learn — Display an actual execution plan", url: "https://learn.microsoft.com/sql/relational-databases/performance/display-an-actual-execution-plan" },
    ],
  },
  {
    id: "sql-nolock-tradeoff",
    title: "WITH (NOLOCK): quando usar e o que custa",
    missions: ["L05", "L41"],
    language: "sql",
    problem: "O conteúdo original recomendava NOLOCK em todas as leituras. É uma prática comum em PHC — mas tem custos que precisa de conhecer.",
    bad: {
      code: `-- Relatório de faturação para o fecho do mês
SELECT SUM(etotal) FROM ft WITH (NOLOCK)
WHERE fdata >= '2025-01-01' AND fdata < '2025-02-01';`,
      why: [
        "NOLOCK = READ UNCOMMITTED: pode ler faturas que ainda vão ser revertidas (leituras sujas).",
        "Pode também saltar ou duplicar linhas se houver movimentações de páginas durante a leitura.",
        "Num número que vai para a contabilidade, 'quase certo' é errado.",
      ],
    },
    good: {
      code: `-- Números oficiais: leitura normal (READ COMMITTED)
SELECT SUM(etotal) FROM ft
WHERE fdata >= '2025-01-01' AND fdata < '2025-02-01' AND anulado = 0;

-- Exploração rápida/monitor em horas de ponta: NOLOCK aceitável,
-- desde que o valor seja indicativo e o diga no relatório.
SELECT TOP (50) fdata, nmdoc, no, etotal
FROM ft WITH (NOLOCK)
ORDER BY fdata DESC;`,
      why: [
        "Regra de decisão: o número vai ser usado para decidir/declarar? → sem NOLOCK.",
        "É só para espreitar/diagnosticar sem bloquear utilizadores? → NOLOCK aceitável.",
        "Alternativa robusta (DBA): READ_COMMITTED_SNAPSHOT na BD elimina bloqueios leitor/escritor sem leituras sujas.",
      ],
    },
    verify: ["Escreva na prova da missão qual das duas situações se aplica ao seu relatório e porquê."],
    sources: [
      { label: "Microsoft Learn — Table hints (NOLOCK / READUNCOMMITTED)", url: "https://learn.microsoft.com/sql/t-sql/queries/hints-transact-sql-table" },
      { label: "Microsoft Learn — Transaction locking and row versioning guide", url: "https://learn.microsoft.com/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide" },
    ],
  },
  {
    id: "xbase-guard-clause",
    title: "Regra de validação legível: cláusulas de guarda + mensagem clara",
    missions: ["L45", "L46", "L51"],
    language: "xbase",
    problem:
      "Bloquear a gravação de uma fatura quando o cliente ultrapassa o limite de crédito (campo de utilizador u_limite na ficha do cliente).",
    bad: {
      code: `IF cl.u_limite > 0
  IF cl.esaldo + ft.etotal > cl.u_limite
    IF !EMPTY(ft.no)
      RETURN .F.
    ENDIF
  ENDIF
ENDIF
RETURN .T.`,
      why: [
        "Três IF aninhados: é preciso segurar tudo na memória de trabalho para perceber a regra.",
        "Devolve .F. sem dizer PORQUÊ — o utilizador fica bloqueado e liga para o suporte.",
      ],
    },
    good: {
      code: `* Regra: limite de crédito do cliente
* Passa (.T.) nos casos em que a regra não se aplica
IF EMPTY(ft.no)
  RETURN .T.          && sem cliente: nada a validar
ENDIF
IF cl.u_limite <= 0
  RETURN .T.          && cliente sem limite definido
ENDIF

LOCAL lnExposicao
lnExposicao = cl.esaldo + ft.etotal

IF lnExposicao > cl.u_limite
  MESSAGEBOX("Limite de crédito excedido: " + ;
    TRANSFORM(lnExposicao, "999,999.99") + " > " + ;
    TRANSFORM(cl.u_limite, "999,999.99"), 48, "Crédito")
  RETURN .F.
ENDIF
RETURN .T.`,
      why: [
        "Cláusulas de guarda: cada caso 'não se aplica' sai logo — lê-se de cima para baixo, sem aninhamento (Fowler, Refactoring: 'Replace Nested Conditional with Guard Clauses').",
        "Variável com nome (lnExposicao) explica a intenção em vez de repetir a conta.",
        "A mensagem diz o problema E os números — o utilizador sabe o que fazer.",
      ],
    },
    verify: [
      "Teste 3 casos na empresa demo: cliente sem limite, dentro do limite, acima do limite.",
      "Se 'não acontece nada', veja a Análise Interna (missão L46): o erro de sintaxe aparece lá.",
    ],
    sources: [
      { label: "Martin Fowler — Replace Nested Conditional with Guard Clauses", url: "https://refactoring.com/catalog/replaceNestedConditionalWithGuardClauses.html" },
      { label: "Microsoft — Visual FoxPro MESSAGEBOX()", url: "https://learn.microsoft.com/previous-versions/visualstudio/foxpro/d1bk3x3x(v=vs.80)" },
    ],
    caveat:
      "Sintaxe VFP genérica. Os nomes dos cursores/campos disponíveis numa regra (ft, cl…) e as funções de mensagem próprias do PHC variam por versão — confirme na ajuda da sua instalação antes de usar.",
  },
];
