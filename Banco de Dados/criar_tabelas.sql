-- Painel Financeiro Executivo - Etapa 1: DDL do modelo estrela (SQL Server / T-SQL)
-- Carga: use os CSVs gerados por gerar_base.py (pasta saida/), separador ';', UTF-8.

CREATE TABLE dCalendario (
    data        DATE        NOT NULL PRIMARY KEY,
    ano         SMALLINT    NOT NULL,
    trimestre   CHAR(2)     NOT NULL,
    mes_num     TINYINT     NOT NULL,
    mes_nome    CHAR(3)     NOT NULL,
    ano_mes     CHAR(7)     NOT NULL,   -- 'AAAA-MM' (usado para ordenar no Power BI)
    dia_semana  VARCHAR(10) NOT NULL,
    dia_util    BIT         NOT NULL
);

CREATE TABLE dProduto (
    id_produto   INT           NOT NULL PRIMARY KEY,
    categoria    VARCHAR(40)   NOT NULL,
    subcategoria VARCHAR(40)   NOT NULL,
    produto      VARCHAR(80)   NOT NULL,
    preco_base   DECIMAL(10,2) NOT NULL,
    custo_unit   DECIMAL(10,2) NOT NULL
);

CREATE TABLE dCliente (
    id_cliente INT         NOT NULL PRIMARY KEY,
    cliente    VARCHAR(40) NOT NULL,
    segmento   VARCHAR(20) NOT NULL,   -- Varejo | Premium | Corporativo
    regiao     VARCHAR(20) NOT NULL
);

CREATE TABLE dCentroCusto (
    id_centro_custo INT         NOT NULL PRIMARY KEY,
    centro_custo    VARCHAR(40) NOT NULL,
    responsavel     VARCHAR(60) NOT NULL
);

CREATE TABLE fVendas (
    id_linha        INT           NOT NULL PRIMARY KEY,
    data            DATE          NOT NULL REFERENCES dCalendario(data),
    id_pedido       INT           NOT NULL,   -- 1 pedido pode ter várias linhas
    id_cliente      INT           NOT NULL REFERENCES dCliente(id_cliente),
    id_produto      INT           NOT NULL REFERENCES dProduto(id_produto),
    id_centro_custo INT           NOT NULL REFERENCES dCentroCusto(id_centro_custo),
    quantidade      INT           NOT NULL,
    receita         DECIMAL(12,2) NOT NULL,   -- líquida (já abatido o desconto)
    custo           DECIMAL(12,2) NOT NULL,   -- CMV + custo operacional do canal
    desconto        DECIMAL(12,2) NOT NULL    -- R$ concedido (informativo)
);
CREATE INDEX ix_fVendas_data ON fVendas(data);

-- Exemplo de carga (ajuste o caminho):
-- BULK INSERT fVendas FROM 'C:\...\saida\fVendas.csv'
-- WITH (FIRSTROW = 2, FIELDTERMINATOR = ';', ROWTERMINATOR = '0x0a', CODEPAGE = '65001');

-- Conferência: deve bater com saida/conferencia_mensal.csv
-- SELECT FORMAT(data,'yyyy-MM') ano_mes, SUM(receita) receita, SUM(custo) custo,
--        COUNT(DISTINCT id_pedido) pedidos
-- FROM fVendas GROUP BY FORMAT(data,'yyyy-MM') ORDER BY 1;
