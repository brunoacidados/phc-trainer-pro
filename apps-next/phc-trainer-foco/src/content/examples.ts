/**
 * Exemplos resolvidos de código ("worked examples").
 *
 * Porquê: o conteúdo original tinha muita teoria sobre SQL/Xbase e quase nenhum código
 * "errado → certo → porquê". Para principiantes, exemplos resolvidos reduzem a carga cognitiva
 * face a resolver problemas do zero (Sweller & Cooper, 1985; Sweller, van Merriënboer & Paas, 2019).
 * O contraste errado/certo ajuda a discriminar o que importa (Durkin & Rittle-Johnson, 2012).
 *
 * Regras de escrita (TDAH):
 *  - 1 problema por exemplo; código curto; comentários só onde há decisão.
 *  - "Porquê" em bullets curtos. Checklist acionável. 1 pergunta de verificação.
 *  - Dúvidas declaradas em `caveat` — nunca inventar nomes de campos sem aviso.
 */

export type ExampleTag = "SQL" | "Xbase" | "Operação";

export interface CodeExample {
  slug: string;
  title: string;
  tag: ExampleTag;
  level: number;
  minutes: number;
  /** uma frase: o que vai conseguir fazer depois */
  outcome: string;
  situation: string;
  wrong: { lang: "sql" | "foxpro"; code: string; problems: string[] };
  right: { lang: "sql" | "foxpro"; code: string };
  why: string[];
  checklist: string[];
  check: { q: string; options: string[]; answer: number; explain: string };
  caveat?: string;
  sources: { title: string; url: string }[];
  relatedMissions: string[];
}

const MS = "https://learn.microsoft.com/en-us/sql";

export const EXAMPLES: CodeExample[] = [
  {
    slug: "backup-verificado",
    title: "Backup que se pode confiar",
    tag: "Operação",
    level: 0,
    minutes: 6,
    outcome: "Fazer um backup antes de qualquer intervenção e confirmar que ele é legível.",
    situation: "Vai mexer numa base de dados de cliente (upgrade, script, parâmetros). Primeiro, um backup.",
    wrong: {
      lang: "sql",
      code: `-- "Fiz backup." Mas ninguém confirmou que ele serve.
BACKUP DATABASE [EMPRESA]
  TO DISK = 'C:\\backups\\empresa.bak';`,
      problems: [
        "Sem CHECKSUM: páginas corrompidas passam despercebidas.",
        "Sem INIT: se o ficheiro já existe, o backup é ACRESCENTADO ao antigo. O restauro pode usar o backup errado.",
        "Sem COPY_ONLY: pode interferir com o plano de backups diferenciais do cliente.",
        "Nunca foi verificado: um backup não testado é uma esperança, não um backup.",
      ],
    },
    right: {
      lang: "sql",
      code: `DECLARE @ficheiro nvarchar(260) =
  N'C:\\PHC-Treino\\backups\\EMPRESA_' + FORMAT(SYSDATETIME(), 'yyyyMMdd_HHmm') + N'.bak';

BACKUP DATABASE [EMPRESA]
  TO DISK = @ficheiro
  WITH COPY_ONLY,  -- não mexe no plano de backups existente
       CHECKSUM,   -- valida cada página enquanto lê
       INIT,       -- ficheiro novo (nome com data/hora)
       STATS = 10; -- mostra progresso a cada 10%

-- Um backup só "existe" depois de verificado:
RESTORE VERIFYONLY FROM DISK = @ficheiro WITH CHECKSUM;`,
    },
    why: [
      "O nome com data/hora impede sobrepor ou misturar backups.",
      "CHECKSUM + VERIFYONLY detetam a maioria dos problemas do ficheiro.",
      "VERIFYONLY não é um restauro real. Antes de intervenções grandes, restaure numa BD de teste.",
      "SQL Server Express não suporta COMPRESSION — não a acrescente por hábito.",
    ],
    checklist: [
      "Backup com data/hora no nome",
      "CHECKSUM e COPY_ONLY presentes",
      "RESTORE VERIFYONLY sem erros",
      "Caminho e tamanho anotados nas notas da intervenção",
    ],
    check: {
      q: "O RESTORE VERIFYONLY terminou sem erros. Isto garante que o backup restaura?",
      options: ["Sim, garante a 100%", "Não: confirma que o ficheiro é legível; a garantia é um restauro de teste"],
      answer: 1,
      explain: "A documentação da Microsoft diz que o VERIFYONLY não verifica a estrutura dos dados. Só um restauro de teste prova que funciona.",
    },
    sources: [
      { title: "Microsoft Learn — BACKUP (Transact-SQL)", url: `${MS}/t-sql/statements/backup-transact-sql` },
      { title: "Microsoft Learn — RESTORE VERIFYONLY", url: `${MS}/t-sql/statements/restore-statements-verifyonly-transact-sql` },
      { title: "Microsoft Learn — Copy-only backups", url: `${MS}/relational-databases/backup-restore/copy-only-backups-sql-server` },
    ],
    relatedMissions: ["L01"],
  },
  {
    slug: "update-seguro",
    title: "UPDATE seguro: ver, travar, confirmar",
    tag: "SQL",
    level: 6,
    minutes: 8,
    outcome: "Alterar dados por script de forma reversível, com travão automático se algo não bater certo.",
    situation:
      "Regra n.º 1: correções fazem-se pelos ecrãs do PHC. Mas o suporte autorizou um script para mudar a zona de 12 clientes de Faro.",
    wrong: {
      lang: "sql",
      code: `UPDATE cl SET zona = 'Sul'
WHERE local LIKE '%Faro%';`,
      problems: [
        "Não viu antes o que ia mudar. LIKE '%Faro%' também apanha 'Farol' ou 'Rua de Faro, Lisboa'.",
        "Sem transação: não há volta atrás.",
        "Se algo falhar a meio, fica metade alterado.",
        "Ninguém confirma quantas linhas mudaram.",
      ],
    },
    right: {
      lang: "sql",
      code: `SET XACT_ABORT ON;  -- qualquer erro de execução anula a transação inteira

-- 1) VER antes de mudar (anote o número: 12)
SELECT no, estab, nome, local, zona
FROM cl
WHERE local = 'Faro' AND zona <> 'Sul';

BEGIN TRY
  BEGIN TRANSACTION;

  UPDATE cl
     SET zona = 'Sul'
   WHERE local = 'Faro' AND zona <> 'Sul';

  -- 2) TRAVAR: o número tem de bater com o SELECT
  IF @@ROWCOUNT <> 12
    THROW 50001, N'Número de linhas inesperado. Nada foi alterado.', 1;

  COMMIT TRANSACTION;  -- 3) CONFIRMAR
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;  -- relança o erro original: ninguém pensa que correu bem
END CATCH;`,
    },
    why: [
      "O SELECT com o MESMO WHERE mostra exatamente o que vai mudar.",
      "@@ROWCOUNT logo a seguir ao UPDATE é o travão: se não bater, THROW → CATCH → ROLLBACK.",
      "XACT_ABORT ON garante rollback mesmo em erros que o TRY não apanha (ex.: timeout do cliente).",
      "'zona <> Sul' torna o script idempotente: corrê-lo 2× não altera nada (e o travão avisa).",
      "Faça backup antes (exemplo 'Backup que se pode confiar').",
    ],
    checklist: ["Backup feito", "SELECT com o mesmo WHERE", "Número anotado e usado no travão", "TRY/CATCH com ROLLBACK e THROW", "Resultado registado nas notas"],
    check: {
      q: "O UPDATE mudou 15 linhas em vez de 12. O que acontece com este script?",
      options: ["Grava as 15 e mostra um aviso", "THROW salta para o CATCH, faz ROLLBACK e nada fica gravado", "Grava só as primeiras 12"],
      answer: 1,
      explain: "O THROW transfere o controlo para o CATCH, que desfaz a transação e relança o erro.",
    },
    caveat:
      "Alterar dados por SQL ignora regras e registos que a aplicação faria (ex.: campos de auditoria usrdata/usrhora). Use só com autorização e confirme os campos no Dicionário de Dados da sua versão.",
    sources: [
      { title: "Microsoft Learn — TRY...CATCH", url: `${MS}/t-sql/language-elements/try-catch-transact-sql` },
      { title: "Microsoft Learn — SET XACT_ABORT", url: `${MS}/t-sql/statements/set-xact-abort-transact-sql` },
      { title: "Microsoft Learn — THROW", url: `${MS}/t-sql/language-elements/throw-transact-sql` },
    ],
    relatedMissions: ["L41", "L44"],
  },
  {
    slug: "erros-sem-engolir",
    title: "Tratar erros sem os esconder",
    tag: "SQL",
    level: 6,
    minutes: 7,
    outcome: "Escrever um CATCH que liberta bloqueios, regista o erro e avisa quem executou.",
    situation: "Um script de aumento de preços de 5% na família FERR falhou. O PHC dos colegas ficou 'pendurado'.",
    wrong: {
      lang: "sql",
      code: `BEGIN TRY
  BEGIN TRAN;
  UPDATE st SET epv1 = epv1 * 1.05 WHERE familia = 'FERR';
  COMMIT;
END TRY
BEGIN CATCH
  PRINT 'Ocorreu um erro';  -- engole o erro
END CATCH;`,
      problems: [
        "A transação fica ABERTA: os bloqueios mantêm-se e os colegas ficam à espera (o 'PHC pendurado').",
        "O número, a mensagem e a linha do erro perdem-se.",
        "Quem executou vê 'concluído' e pensa que correu bem.",
      ],
    },
    right: {
      lang: "sql",
      code: `SET XACT_ABORT ON;
DECLARE @erro int, @msg nvarchar(4000), @linha int;

BEGIN TRY
  BEGIN TRANSACTION;
  UPDATE st SET epv1 = ROUND(epv1 * 1.05, 2) WHERE familia = 'FERR';
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  SELECT @erro = ERROR_NUMBER(), @msg = ERROR_MESSAGE(), @linha = ERROR_LINE();

  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;  -- 1.º libertar bloqueios

  -- 2.º registar DEPOIS do rollback (senão o registo também era anulado)
  INSERT INTO u_logscript (data, script, erro, mensagem, linha)
  VALUES (SYSDATETIME(), N'aumento-5pct-FERR', @erro, @msg, @linha);

  THROW;  -- 3.º avisar quem executou
END CATCH;`,
    },
    why: [
      "Ordem importa: guardar detalhes → ROLLBACK → registar → THROW.",
      "Um INSERT feito antes do ROLLBACK seria desfeito com tudo o resto.",
      "ROUND(…, 2) evita preços com 4 casas decimais que depois aparecem na fatura.",
      "THROW sem argumentos relança o erro original com número e mensagem intactos.",
    ],
    checklist: ["CATCH nunca vazio", "ROLLBACK condicionado a @@TRANCOUNT", "Registo depois do ROLLBACK", "THROW no fim"],
    check: {
      q: "Porque é que o INSERT no registo de erros vem DEPOIS do ROLLBACK?",
      options: ["Por estilo", "Porque o ROLLBACK desfaria também o registo", "Porque o INSERT é mais rápido assim"],
      answer: 1,
      explain: "O ROLLBACK anula tudo o que foi escrito dentro da transação — incluindo um registo de erro feito antes.",
    },
    caveat:
      "u_logscript é uma tabela de utilizador ilustrativa. No PHC, crie-a pelo framework de Tabelas de Utilizador (missão L44), não por CREATE TABLE direto.",
    sources: [
      { title: "Microsoft Learn — ERROR_MESSAGE", url: `${MS}/t-sql/functions/error-message-transact-sql` },
      { title: "Microsoft Learn — TRY...CATCH", url: `${MS}/t-sql/language-elements/try-catch-transact-sql` },
      { title: "Erland Sommarskog (MVP) — Error and Transaction Handling in SQL Server", url: "https://www.sommarskog.se/error_handling/Part1.html" },
    ],
    relatedMissions: ["L41", "L44"],
  },
  {
    slug: "nolock-quando",
    title: "NOLOCK: quando sim, quando nunca",
    tag: "SQL",
    level: 6,
    minutes: 6,
    outcome: "Decidir se uma consulta pode usar NOLOCK com base no que vai ser feito com o número.",
    situation: "Pedem-lhe o total faturado de janeiro para fechar o IVA. Um colega diz: 'mete NOLOCK, é mais rápido'.",
    wrong: {
      lang: "sql",
      code: `SELECT SUM(etotal) AS faturado
FROM ft WITH (NOLOCK)
WHERE fdata BETWEEN '20250101' AND '20250131';`,
      problems: [
        "NOLOCK = READUNCOMMITTED: pode somar uma fatura que está a ser gravada e depois é cancelada.",
        "Durante divisões de página, o mesmo registo pode ser lido 2× ou saltado.",
        "Um número para declarar ao Estado não pode ser 'aproximado'.",
        "Não exclui documentos anulados.",
      ],
    },
    right: {
      lang: "sql",
      code: `-- Número para DECIDIR (IVA, fecho, comissões): leitura normal, sem NOLOCK
SELECT SUM(ft.etotal) AS faturado
FROM ft
WHERE ft.fdata >= '20250101' AND ft.fdata < '20250201'
  AND ft.anulado = 0;

-- Painel INDICATIVO (tendência dos últimos 7 dias): NOLOCK aceitável
SELECT TOP (50) ft.fdata, ft.nmdoc, ft.fno, ft.nome, ft.etotal
FROM ft WITH (NOLOCK)  -- valores indicativos
WHERE ft.fdata >= DATEADD(day, -7, CAST(GETDATE() AS date))
ORDER BY ft.fdata DESC;`,
    },
    why: [
      "Pergunta-chave: 'o que acontece se este número estiver errado?' Se a resposta envolve dinheiro, impostos ou clientes → sem NOLOCK.",
      "Para lentidão, a solução certa é filtro por período + índice adequado, não ler dados sujos.",
      "NOLOCK serve para exploração e painéis onde um erro pequeno é tolerável.",
    ],
    checklist: ["Sei para que serve o número", "Filtro por período", "Anulados excluídos", "NOLOCK só se indicativo"],
    check: {
      q: "Qual destas consultas pode usar NOLOCK?",
      options: ["Total para a declaração periódica de IVA", "Gráfico de tendência de vendas no painel da direção", "Saldo para bloquear crédito a um cliente"],
      answer: 1,
      explain: "Só a tendência tolera imprecisão. IVA e crédito afetam dinheiro e obrigações legais.",
    },
    caveat:
      "Notas de crédito e tipos de documento: confirme no Dicionário de Dados como a sua versão guarda o sinal (ex.: campo tipodoc) antes de somar valores de ft.",
    sources: [
      { title: "Microsoft Learn — Table hints (READUNCOMMITTED/NOLOCK)", url: `${MS}/t-sql/queries/hints-transact-sql-table` },
      { title: "Microsoft Learn — Transaction locking and row versioning guide", url: `${MS}/relational-databases/sql-server-transaction-locking-and-row-versioning-guide` },
    ],
    relatedMissions: ["L41", "L42"],
  },
  {
    slug: "datas-sargable",
    title: "Filtrar datas sem matar o índice",
    tag: "SQL",
    level: 6,
    minutes: 5,
    outcome: "Escrever filtros de período que usam índices e não falham com horas nem fins de mês.",
    situation: "A análise 'vendas do mês' demora 40 segundos num cliente com 8 anos de faturação.",
    wrong: {
      lang: "sql",
      code: `SELECT fno, nome, etotal FROM ft
WHERE YEAR(fdata) = 2025 AND MONTH(fdata) = 1;

-- ou
WHERE CONVERT(varchar(8), fdata, 112) = '20250115';`,
      problems: [
        "Uma função aplicada à COLUNA obriga o SQL Server a calcular a função em todas as linhas: lê a tabela inteira (scan).",
        "O índice sobre fdata não pode ser usado para saltar diretamente ao período (seek).",
      ],
    },
    right: {
      lang: "sql",
      code: `-- Intervalo semiaberto: >= início  E  < início do período seguinte
SELECT fno, nome, etotal FROM ft
WHERE fdata >= '20250101' AND fdata < '20250201';

-- Um dia concreto
WHERE fdata >= '20250115' AND fdata < '20250116';`,
    },
    why: [
      "A coluna fica 'nua' → o índice pode ser usado (condição SARGable).",
      "'< início do seguinte' funciona com qualquer hora e com meses de 28, 30 ou 31 dias.",
      "O formato 'AAAAMMDD' é interpretado igual em qualquer idioma do servidor.",
    ],
    checklist: ["Nenhuma função sobre a coluna no WHERE", "Intervalo semiaberto", "Datas em AAAAMMDD"],
    check: {
      q: "Qual filtro permite usar o índice de fdata?",
      options: ["WHERE YEAR(fdata) = 2025", "WHERE fdata >= '20250101' AND fdata < '20260101'", "WHERE LEFT(CONVERT(varchar, fdata, 112), 4) = '2025'"],
      answer: 1,
      explain: "Só a segunda deixa a coluna sem função — o otimizador pode fazer seek no índice.",
    },
    sources: [
      { title: "Microsoft Learn — Index architecture and design guide", url: `${MS}/relational-databases/sql-server-index-design-guide` },
      { title: "Microsoft Learn — Date and time data types (formatos independentes do idioma)", url: `${MS}/t-sql/data-types/datetime-transact-sql` },
    ],
    relatedMissions: ["L49", "L41"],
  },
  {
    slug: "joins-pelo-stamp",
    title: "Ligar cabeçalho e linhas pelo stamp",
    tag: "SQL",
    level: 6,
    minutes: 6,
    outcome: "Juntar faturas, linhas e clientes sem multiplicar linhas nem somar a dobrar.",
    situation: "Relatório de artigos vendidos por fatura. Os totais saem 3× maiores do que no PHC.",
    wrong: {
      lang: "sql",
      code: `SELECT ft.fno, fi.ref, fi.design, fi.qtt
FROM ft
JOIN fi ON fi.fno = ft.fno;`,
      problems: [
        "O número da fatura (fno) repete-se entre séries, tipos de documento e anos.",
        "Cada linha junta-se a várias faturas com o mesmo número → linhas multiplicadas e totais errados.",
      ],
    },
    right: {
      lang: "sql",
      code: `SELECT ft.nmdoc, ft.fno, ft.fdata, cl.nome,
       fi.ref, fi.design, fi.qtt, fi.etiliquido
FROM ft
JOIN fi ON fi.ftstamp = ft.ftstamp                 -- linha → cabeçalho, pela chave técnica
JOIN cl ON cl.no = ft.no AND cl.estab = ft.estab   -- cliente = número + estabelecimento
WHERE ft.fdata >= '20250101' AND ft.fdata < '20250201'
  AND ft.anulado = 0
ORDER BY ft.fdata, ft.fno;`,
    },
    why: [
      "<tabela>stamp é a chave técnica única de cada registo; as linhas guardam o stamp do cabeçalho.",
      "O cliente identifica-se por número E estabelecimento — só o número junta sucursais.",
      "Regra de verificação: conte as linhas de fi para UMA fatura no PHC e compare com a consulta.",
    ],
    checklist: ["JOIN pelo stamp", "Cliente por no + estab", "Período filtrado", "Total comparado com o PHC numa fatura"],
    check: {
      q: "Porque não se ligam linhas a faturas pelo número (fno)?",
      options: ["Porque é mais lento", "Porque o número repete-se entre séries e anos; o stamp é único", "Porque fno é texto"],
      answer: 1,
      explain: "Só a chave única garante que cada linha pertence a exatamente um cabeçalho.",
    },
    caveat:
      "Os nomes (ft, fi, cl, ftstamp, etiliquido, anulado) seguem a estrutura habitual do PHC Gestão. A fonte primária é o Dicionário de Dados da SUA instalação — confirme lá antes de usar.",
    sources: [
      { title: "Microsoft Learn — Joins (SQL Server)", url: `${MS}/relational-databases/performance/joins` },
    ],
    relatedMissions: ["L41", "L42"],
  },
  {
    slug: "pesquisa-sem-injecao",
    title: "Pesquisa com texto do utilizador sem injeção de SQL",
    tag: "Xbase",
    level: 7,
    minutes: 8,
    outcome: "Montar SQL com texto escrito pelo utilizador sem partir a consulta nem abrir uma falha de segurança.",
    situation: "Um ecrã personalizado tem um campo 'Pesquisar cliente'. Alguém escreve O'Neil e dá erro.",
    wrong: {
      lang: "foxpro",
      code: `LOCAL lcSql
lcSql = "SELECT no, nome FROM cl WHERE nome LIKE '%" + ALLTRIM(m.pesquisa) + "%'"
u_sqlexec(lcSql, "curCl")`,
      problems: [
        "A plica de O'Neil fecha a string SQL → erro de sintaxe.",
        "Pior: escrever  x'; DELETE FROM cl --  transforma texto em código (injeção de SQL).",
        "O resultado de u_sqlexec não é verificado.",
        "Sem TOP: uma pesquisa vazia traz todos os clientes.",
      ],
    },
    right: {
      lang: "foxpro",
      code: `LOCAL lcPesq, lcSql
* 1) Limitar o tamanho
lcPesq = LEFT(ALLTRIM(m.pesquisa), 60)
IF EMPTY(lcPesq)
   msg("Escreva pelo menos uma letra para pesquisar.")
   RETURN .F.
ENDIF
* 2) Escapar a plica: O'Neil -> O''Neil  (o texto fica SEMPRE como dado)
lcPesq = STRTRAN(lcPesq, "'", "''")

lcSql = "SELECT TOP 100 no, estab, nome FROM cl " + ;
        "WHERE nome LIKE N'%" + lcPesq + "%' ORDER BY nome"

* 3) Verificar o resultado
IF !u_sqlexec(lcSql, "curCl")
   msg("Não foi possível pesquisar clientes. Nada foi alterado.")
   RETURN .F.
ENDIF`,
    },
    why: [
      "A defesa preferida é parametrizar (OWASP). Em T-SQL: sp_executesql com @parâmetros.",
      "Quando só é possível concatenar, duplicar a plica neutraliza-a dentro de strings delimitadas por plicas.",
      "Validar tamanho e vazio reduz abuso e consultas pesadas.",
      "Verificar o retorno evita trabalhar com um cursor que não existe ou é antigo.",
    ],
    checklist: ["Tamanho limitado", "Vazio tratado", "Plica escapada (ou parâmetro)", "TOP na pesquisa", "Retorno verificado"],
    check: {
      q: "O utilizador escreve  a' OR 1=1 --  . Com STRTRAN(…, \"'\", \"''\"), o que o SQL Server recebe?",
      options: ["Uma condição OR que devolve tudo", "O texto literal  a'' OR 1=1 --  dentro da string, pesquisado como nome", "Um erro de sintaxe"],
      answer: 1,
      explain: "A plica duplicada é lida como um carácter de texto, não como fim da string. Tudo fica dentro do LIKE.",
    },
    caveat:
      "Dúvida declarada: o SQLEXEC do Visual FoxPro aceita parâmetros ?m.variavel. Não confirmámos em documentação pública se o u_sqlexec do PHC os repassa em todas as versões — se a sua versão suportar, prefira-os ao escape manual. Os caracteres % e _ dentro do texto continuam a funcionar como curingas do LIKE.",
    sources: [
      { title: "OWASP — SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
      { title: "Microsoft Learn — sp_executesql", url: `${MS}/relational-databases/system-stored-procedures/sp-executesql-transact-sql` },
    ],
    relatedMissions: ["L47", "L48"],
  },
  {
    slug: "xbase-try-catch",
    title: "Validação Xbase que não rebenta: TRY/CATCH e cursores",
    tag: "Xbase",
    level: 7,
    minutes: 9,
    outcome: "Escrever uma validação de evento que trata falhas de SQL, erros inesperados e fecha sempre o cursor.",
    situation: "Regra: bloquear a gravação de uma fatura se o cliente exceder o plafond de crédito.",
    wrong: {
      lang: "foxpro",
      code: `u_sqlexec("SELECT esaldo FROM cl WHERE no = " + TRANSFORM(ft.no), "curSaldo")
IF curSaldo.esaldo > 5000
   msg("Cliente acima do limite de crédito")
   RETURN .F.
ENDIF`,
      problems: [
        "Se o u_sqlexec falhar, curSaldo não existe → erro 'Alias not found' no meio da gravação.",
        "Ou pior: existe um curSaldo ANTIGO de outra fatura → decisão com dados errados, sem aviso.",
        "Ignora o estabelecimento (estab) → pode ler o saldo da sucursal errada.",
        "Limite fixo (5000) no código em vez do plafond do cliente; o cursor nunca é fechado.",
      ],
    },
    right: {
      lang: "foxpro",
      code: `LOCAL llOk, loErro, lcSql
llOk = .T.
lcSql = "SELECT esaldo, eplafond FROM cl WHERE no = " + TRANSFORM(ft.no) + ;
        " AND estab = " + TRANSFORM(ft.estab)
TRY
   IF USED("curSaldo")
      USE IN curSaldo            && nunca decidir com um cursor antigo
   ENDIF
   IF !u_sqlexec(lcSql, "curSaldo")
      msg("Não foi possível verificar o crédito. Tente de novo ou contacte o suporte.")
      llOk = .F.
   ELSE
      IF RECCOUNT("curSaldo") > 0 AND curSaldo.eplafond > 0 ;
         AND curSaldo.esaldo + ft.etotal > curSaldo.eplafond
         msg("Crédito excedido: saldo " + TRANSFORM(curSaldo.esaldo) + ;
             " + este documento ultrapassa o plafond de " + TRANSFORM(curSaldo.eplafond) + ".")
         llOk = .F.
      ENDIF
   ENDIF
CATCH TO loErro
   msg("Erro inesperado na validação de crédito: " + loErro.Message)
   llOk = .F.
FINALLY
   IF USED("curSaldo")
      USE IN curSaldo            && limpa sempre, com ou sem erro
   ENDIF
ENDTRY
RETURN llOk                      && RETURN fica FORA do TRY (regra do VFP)`,
    },
    why: [
      "O Visual FoxPro não permite RETURN dentro de TRY/CATCH/FINALLY (erro 2060). Por isso usa-se a variável llOk e um único RETURN no fim.",
      "FINALLY corre sempre → o cursor é fechado com ou sem erro.",
      "Fechar o cursor ANTES da consulta impede decisões com dados de outra fatura.",
      "Mensagens dizem o que aconteceu E o que fazer — o utilizador não fica bloqueado sem saída.",
      "Falhar 'fechado' (llOk = .F. em caso de erro) é mais seguro do que deixar gravar sem validar.",
    ],
    checklist: ["Cursor fechado antes e no FINALLY", "Retorno do u_sqlexec verificado", "Cliente por no + estab", "Um único RETURN, fora do TRY", "Mensagem com próxima ação"],
    check: {
      q: "Porque é que o RETURN está depois do ENDTRY e não dentro do CATCH?",
      options: ["Por legibilidade apenas", "Porque o VFP não permite RETURN dentro de TRY/CATCH/FINALLY (erro 2060)", "Porque o CATCH nunca corre"],
      answer: 1,
      explain: "É uma regra da linguagem: RETURN/RETRY não são permitidos dentro da estrutura TRY.",
    },
    caveat:
      "Campos esaldo/eplafond e a função msg() são os habituais do PHC; confirme no Dicionário de Dados e na lista de funções internas da sua versão. Decida com o cliente se um erro técnico deve bloquear (mais seguro) ou só avisar.",
    sources: [
      { title: "Microsoft Learn — Visual FoxPro: Structured Error Handling", url: "https://learn.microsoft.com/en-us/previous-versions/visualstudio/foxpro/bhe7807w(v=vs.80)" },
    ],
    relatedMissions: ["L45", "L46", "L51"],
  },
];

export function exampleBySlug(slug: string): CodeExample | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}

export function examplesForMission(missionId: string): CodeExample[] {
  return EXAMPLES.filter((e) => e.relatedMissions.includes(missionId));
}
