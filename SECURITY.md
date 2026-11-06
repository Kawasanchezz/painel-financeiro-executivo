# Política de segurança

## Escopo
Projeto acadêmico de portfólio: dashboard estático (HTML, CSS e JavaScript puro) e scripts Python que geram **dados simulados**. Não há backend, API, autenticação, banco em execução, cookies nem dados reais de pessoas ou empresas.

## Versões suportadas
| Versão | Suporte |
|---|---|
| Ramo principal (`main`) | Sim |

## Como reportar uma vulnerabilidade
Use o recurso **"Report a vulnerability"** (aba *Security* do repositório no GitHub – Private vulnerability reporting). Não abra uma issue pública com detalhes de exploração. Informe os arquivos afetados e passos para reproduzir.

## Controles existentes
- Todo texto vindo de `dados.js` é escapado (`esc()` em `Dashboard/script.js`) antes de entrar em `innerHTML` ou em atributos.
- `dashboard.html` define Content-Security-Policy (`script-src 'self'`, sem `eval` e sem scripts de terceiros) e `referrer: no-referrer`.
- Nenhum recurso externo (CDN, fontes, imagens) é carregado.
- Dependências Python fixadas em `requirements.txt` e verificadas com `pip-audit`.
- A CSP não usa `unsafe-inline` nem `unsafe-eval`: o JavaScript não gera atributos `style` em HTML; larguras e cores dinâmicas são aplicadas via `element.style` (CSSOM).
- `Banco de Dados/gerar_base.py` falha se algum texto exportado começar com `=`, `+`, `-` ou `@` (injeção de fórmulas em CSV/Excel).
- `dados.js` inválido ou ausente faz o dashboard exibir uma mensagem de erro em vez de quebrar.
- Testes automatizados: `python Dashboard/rodar_testes.py` (requer Chrome ou Edge). Cobre fluxo funcional sob a CSP, XSS com e sem escape e defesa da CSP.
- Automação no GitHub: `.github/workflows/ci.yml` (auditoria de dependências, compilação e testes), `codeql.yml` (análise estática) e `dependency-review.yml` (bloqueia PRs com dependência vulnerável), ambos com `permissions` mínimas; `dependabot.yml` para atualizações.
- Licença: MIT (ver `LICENSE`).

## Limitações conhecidas
- As actions dos workflows usam tags de versão (`@v4`, `@v3`), não SHAs fixos.
- A CSP via `<meta>` não suporta `frame-ancestors`; se o dashboard for hospedado, configure esse cabeçalho no servidor.
- Os dados são sintéticos e determinísticos (`seed=42`); o gerador **não** é adequado para fins criptográficos.
- Este documento não garante ausência de vulnerabilidades.
