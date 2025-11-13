# PLANO DE TESTES — SISVida

> OBJETIVO DO DOCUMENTO
>
> Usar este Plano de Teste para descrever a abordagem de teste e a estrutura geral que conduzirá os testes do projeto SISVida.

---

## Sumário

1. INTRODUÇÃO
  1.1 OBJETIVO
  1.2 VISÃO GERAL DO PROJETO
2. ESCOPO
  2.1 DENTRO DO ESCOPO
  2.2 FORA DO ESCOPO
3. ESTRATÉGIA DE TESTES
  3.1 OBJETIVOS DOS TESTES
  3.2 SUPOSIÇÕES DE TESTES
  3.3 ABORDAGEM DE DADOS
  3.4 NÍVEL DE TESTE
  3.5 TESTE DE UNIDADES
  3.6 TESTES FUNCIONAIS
  3.7 TESTE DE ACEITAÇÃO DO USUÁRIO
  3.8 TESTES DE REGRESSÃO
4. Estratégia de execução
  4.1 CRITÉRIOS DE ENTRADA
  4.2 CRITÉRIOS DE SAÍDA
  4.3 VALIDAÇÃO E GERENCIAMENTO DE DEFEITOS
5. REQUISITOS DE AMBIENTE
  5.1 AMBIENTES DE TESTE
6. Divisão/departamento afetado
7. DEPENDÊNCIAS

---

## 1. INTRODUÇÃO

### 1.1 OBJETIVO

O objetivo deste Plano de Teste é descrever a abordagem, responsabilidades, critérios e recursos necessários para validar a qualidade do sistema SISVida. O documento orienta as atividades de teste para garantir que os fluxos principais (registro, autenticação, agendamento, reagendamento, visualização de exames, dashboards de usuário e médico) funcionem corretamente e que as integrações com o Supabase e APIs proxy (CNES/IBGE/reverse-geocode) se comportem conforme esperado.

### 1.2 VISÃO GERAL DO PROJETO

SISVida é uma aplicação web construída com React (arquivos em `src/*.jsx`), que usa Supabase para autenticação e persistência (`src/supabaseClient.js`) e conta com endpoints proxy em `/api` para consultar dados públicos (CNES/IBGE). Usuários podem se registrar, autenticar, agendar/reagendar consultas e exames, e visualizar resultados. O sistema tem duas principais vertentes de interface: paciente e médico.

---

## 2. ESCOPO

### 2.1 DENTRO DO ESCOPO

- Testes de integração entre frontend e Supabase (autenticação, leitura/escrita em `profiles`, `logistica_cliente`, `logistica_medico`).
- Testes funcionais dos componentes React críticos:
  - Autenticação e sessão: `src/Login.jsx`, `src/Register.jsx`, `src/App.jsx`.
  - Agendamento e reagendamento: `src/AgendarConsulta.jsx`, `src/ReagendarConsulta.jsx`.
  - Dashboards e listagens: `src/MainDashboard.jsx`, `src/DoctorDashboard.jsx`, `src/Exames.jsx`.
- Testes de integração com endpoints internos/proxy:
  - `/api/reverse-geocode`, `/api/ibge-codes`, `/api/unidades`.
- Testes de dados (consistência de inserts/updates) nas tabelas utilizadas.
- Testes de usabilidade críticos (mensagens de erro/sucesso exibidas via SweetAlert2).

### 2.2 FORA DO ESCOPO

- Testes de performance de larga escala (stress/load) detalhados — apenas smoke básico será coberto.
- Testes de integração com serviços externos em produção (somente mocks/fixtures ou ambiente de QA serão usados).
- Verificação minuciosa de assets gráficos (ícones, imagens) além da presença básica.
- Processamento/armazenamento de arquivos complexos (não aplicável no escopo atual).

---

## 3. ESTRATÉGIA DE TESTES

### 3.1 OBJETIVOS DOS TESTES

- Validar autenticação e gerenciamento de sessão (login, logout, verificação de perfil e redirecionamentos).
- Validar fluxo de registro e criação de perfis (`profiles`) e entradas iniciais em `logistica_cliente`.
- Validar fluxos de agendamento e reagendamento, garantindo inserções/atualizações corretas em `logistica_cliente` e `logistica_medico`.
- Validar apresentação de exames e ações de UI em `src/Exames.jsx`.
- Validar integração com endpoints `/api/*` e comportamento em falhas (timeouts, respostas malformadas).
- Garantir consistência de dados e formatos (datas, arrays JSON quando aplicáveis).
- Cobrir fluxos UX críticos com testes E2E (registro → login → agendar → visualizar no dashboard).

### Tarefas e responsabilidades (resumo)

- Desenvolvedores:
  - Manter testes unitários e de integração para utilitários e componentes críticos.
  - Fornecer scripts de seed / fixtures para QA.
  - Corrigir defeitos reportados pelo QA.
- Equipe de QA:
  - Implementar e executar E2E (Playwright/Cypress) para fluxos críticos.
  - Executar testes manuais/UAT quando necessário.
  - Gerenciar casos de teste e defeitos.
- Product / PO:
  - Aprovar critérios de aceitação e priorizar cobertura automatizada.
- DevOps / Infra:
  - Manter ambiente Supabase de QA e endpoints `/api` acessíveis (ou mocks).

---

### 3.2 SUPOSIÇÕES DE TESTES

- Existe instância Supabase dedicada a QA com variáveis de ambiente de QA (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY).
- APIs internas (`/api/...`) podem ser mockadas para execução determinística de testes.
- Testes E2E podem controlar localStorage e geolocalização (mock `navigator.geolocation`).
- Não serão usados dados de produção sem anonimização.
- Assets não são críticos para a lógica — testes focam comportamento.

---

### 3.3 ABORDAGEM DE DADOS

> Observação: esta seção descreve como os dados de teste deverão ser tratados no ambiente de QA (documentado; não será executado automaticamente aqui).

#### Ambiente e separação
- Banco Supabase de QA separado do ambiente de produção.
- Uso de variáveis de ambiente específicas para QA.

#### Seed / Fixtures
- Fornecer script idempotente (Node/SQL) que cria fixtures mínimas:
  - `profiles`: paciente_test, medico_test, usuario_sem_profile.
  - `logistica_cliente`: registro por paciente com ao menos uma consulta/exame em alguns casos.
  - `logistica_medico`: agenda com arrays por dia (`agenda`) e `consultas_marcadas` para testes de disponibilidade.
- Fixtures JSON para respostas das APIs `/api/unidades`, `/api/ibge-codes`, `/api/reverse-geocode`.

#### Isolamento e limpeza
- Estratégias possíveis:
  - Criar usuário temporário por cenário e excluir no teardown.
  - Restaurar snapshot DB antes de cada run CI.

#### Tipos de dados de teste
- `paciente_test@fake.local` (client_type: paciente)
- `medico_test@fake.local` (client_type: medico)
- `usuario_sem_profile` (para fluxo de registro)
- Coordenadas de geolocalização fixas para ordenação de unidades

#### Segurança
- Não inserir dados reais. Se usar snapshot de produção, proceder com anonimização e aprovação.

#### Mutabilidade
- Documentar testes destrutivos (agendar/reagendar/cancelar). Preferir usuário isolado para mutações.

#### Observabilidade
- Ativar logs de Supabase/servidor no QA. Registrar tempos de resposta de mocks.

---

### 3.4 NÍVEL DE TESTE

| Tipo de teste | Objetivo | Responsáveis |
|---|---:|---|
| Teste Unitário | Validar unidades de código (funções, helpers, componentes isolados) | Desenvolvedores |
| Teste de Integração | Verificar comunicação entre componentes/serviços (ex.: front ↔ supabase) | Dev / QA |
| Teste de Sistema | Validar fluxo do sistema como um todo (UI + backend + APIs) | QA |
| Teste de Aceitação (UAT) | Validar critérios de negócio com usuários finais | Usuários / Gerente de Testes |

---

### 3.5 TESTE DE UNIDADES

#### Escopo de unit tests
- Helpers e utilitários:
  - Máscaras e validação de CPF (função `maskCpf` usada em `Login.jsx` e `Register.jsx`).
  - Funções de cálculo de distância (`calcularDistancia`) em `AgendarConsulta.jsx`/`DoctorDashboard.jsx`.
  - Formatação de datas (getFirstValidDate e formatToStorageDate em `ReagendarConsulta.jsx`).
- Componentes React puros com lógica interna mínima.

#### Participantes (exemplo)
- Ana Luisa — Gerente de Testes
- Fernanda — Líder de Testes
- Letícia Fani — Analista de Testes

---

### 3.6 TESTES FUNCIONAIS

Abaixo alguns casos de teste funcionais exemplares; expandir para a suíte completa.

#### TC001 — Login com CPF válido
- ID: TC001
- Componente: `src/Login.jsx`
- Pré-condições: Página de login disponível; fixture `paciente_test` existe.
- Etapas:
  1. Abrir modal de login (ou página de login).
  2. Informar CPF: `123.123.123-00`.
  3. Informar senha válida: `validpassword123`.
  4. Clicar em `Entrar`.
- Dados de teste: CPF = `123.123.123-00`, senha = `validpassword123`.
- Resultado esperado: Usuário autenticado; redirecionamento conforme `client_type`.
- Pós-condições: Sessão ativa.
- Critérios de aceitação: aprovado se usuário logado e redirecionado corretamente.

#### TC002 — Registro de novo usuário
- ID: TC002
- Componente: `src/Register.jsx`
- Pré-condições: Ambiente QA ativo e Supabase acessível.
- Etapas:
  1. Abrir modal de registro.
  2. Preencher formulário com dados válidos (nome, cpf, senha, telefone, client_type = paciente).
  3. Submeter registro.
- Resultado esperado: Usuário criado em `auth`; entrada em `profiles` e `logistica_cliente` criadas.

#### TC003 — Agendar Consulta (fluxo completo)
- ID: TC003
- Componente: `src/AgendarConsulta.jsx`
- Pré-condições: Usuário autenticado (paciente_test), fixtures de unidades e médicos presentes.
- Etapas:
  1. Navegar para `/agendar-consulta`.
  2. Selecionar unidade da lista (fixture CNES).
  3. Selecionar data válida e horário disponível.
  4. Selecionar médico e confirmar agendamento.
- Resultado esperado: Registro adicionado em `logistica_cliente.consultas_marcadas` e `logistica_medico.consultas_marcadas`.

#### TC004 — Reagendar Consulta
- ID: TC004
- Componente: `src/ReagendarConsulta.jsx`
- Pré-condições: Existe uma consulta do paciente_test.
- Etapas:
  1. Abrir a tela de reagendamento para a consulta.
  2. Escolher nova data/hora e confirmar.
- Resultado esperado: Consulta atualizada no `logistica_cliente` e `logistica_medico`; slot antigo removido, novo adicionado.

#### TC005 — Falha em API externa
- ID: TC005
- Componente: `src/AgendarConsulta.jsx`
- Pré-condições: Mock da API `/api/unidades` retorna 500 ou JSON inválido.
- Etapas:
  1. Tentar carregar lista de unidades.
- Resultado esperado: UI mostra mensagem de erro amigável; aplicação não trava.

(Expandir a lista para cobertura completa de páginas e flows.)

---

### 3.7 TESTE DE ACEITAÇÃO DO USUÁRIO (UAT)

- Cenário: Usuário final realiza registro, login e agenda consulta com sucesso.
- Critérios de aceitação UAT:
  - Usuário consegue registrar-se e confirmar que perfil foi criado.
  - Usuário agenda consulta e visualiza agendamento em `MainDashboard`.
  - Mensagens de erro/sucesso são claras.

Participantes (exemplo): Ana Luisa (Gerente de Testes), Fernanda (Líder), Letícia Fani (Analista).

---

### 3.8 TESTES DE REGRESSÃO

- Frequência: rodar suíte de regressão em CI a cada PR merge na main; suíte curta (smoke) em cada deploy de QA.
- Conteúdo: testes E2E que cobrem registro, login, agendamento e reagendamento.
- Critérios mínimos: todos os testes smoke passam antes do deploy para staging.

---

## 4. ESTRATÉGIA DE EXECUÇÃO

### 4.1 CRITÉRIOS DE ENTRADA

Antes de iniciar execução formal de testes:
- Ambiente(s) de teste disponível e acessível (Supabase QA + app deployado em QA).
- Dados de teste/fixtures seed carregados ou capacidade de criar usuários temporários.
- Código mesclado no branch de QA (merge concluído).
- Desenvolvedores concluíram testes unitários e os resultados foram analisados.
- Roteiros de teste escritos e revisados.

### 4.2 CRITÉRIOS DE SAÍDA

Condições desejáveis para considerar ciclo de testes concluído:
- 100% dos roteiros de teste executados (ou justificativa documentada para casos não executados).
- Taxa de aprovação ≥ 90% dos testes automatizados/planejados.
- Nenhum defeito crítico (Severidade 1) aberto.
- Defeitos de severidade 2 documentados com plano de correção.
- Relatório de testes e métricas coletadas.
- Ambiente de testes limpo e backup realizado.

### 4.3 VALIDAÇÃO E GERENCIAMENTO DE DEFEITOS

- Defeitos serão registrados em ferramenta de rastreamento (ex.: JIRA, GitHub Issues) ou planilha compartilhada.
- Atributos do defeito: ID, título, descrição, passos para reproduzir, severidade, prioridade, logs/screenshots, responsável.

Critérios de severidade (exemplo):
- 1 — Crítica: sistema bloqueado; bloqueia continuidade dos testes.
- 2 — Elevado: funcionalidade majoritária não utilizável.
- 3 — Média: funcionalidade com workaround.
- 4 — Baixa: problema cosmético/UX.

Processo:
1. Testador registra o defeito com evidências e atribui ao desenvolvedor responsável.
2. Desenvolvedor corrige e envia PR; QA valida correção e reabre/fecha defeito conforme resultado.
3. Fechamento só ocorre após validação em ambiente de QA.

---

## 5. REQUISITOS DE AMBIENTE

### 5.1 AMBIENTES DE TESTE

- Local (dev) — para desenvolvimento rápido e testes manuais.
- QA (staging) — app deployado com variáveis de ambiente apontando para Supabase QA e endpoints `/api` de QA ou mocks.
- CI — pipeline para execução de testes unitários e E2E (Playwright/Cypress).

Requisitos técnicos mínimos:
- Node.js v16+ compatível com projeto (ver `package.json`).
- Acesso à instância Supabase QA (chaves em segredos CI/variáveis de ambiente).
- Acesso a um navegador headless (Chromium) para execução E2E.
- Ferramenta de logs para API backend (opcional mas recomendada).

Segurança:
- Segredos (chaves Supabase) armazenados em secrets do CI/Deploy; não versionar chaves no repositório.

---

## 6. DIVISÃO / DEPARTAMENTO AFETADO

- Área de negócio: Saúde pública / Agendamento de serviços.
- Gerente responsável: (preencher conforme organização)
- Testadores principais: Ana Luisa (Gerente de Testes), Fernanda (Líder), Letícia Fani (Analista)
- Desenvolvimento: equipe front-end / back-end responsável pelos endpoints em `server.cjs` e `api/`.

---

## 7. DEPENDÊNCIAS

- Disponibilidade de Supabase QA (DB + Auth).
- Endpoints `/api/reverse-geocode`, `/api/ibge-codes`, `/api/unidades` — disponível ou mockável.
- Recursos humanos: desenvolvedores para correção rápida de defeitos; QA para execução de testes.
- Prazos: alinhamento com sprint/lançamento para priorização de correções.

---

## Anexos úteis (links / comandos)

- Arquivos relevantes do projeto:
  - `src/App.jsx` — roteamento e lógica de sessão
  - `src/supabaseClient.js` — exporta `supabase` usado em toda a app
  - `src/AgendarConsulta.jsx`, `src/ReagendarConsulta.jsx`, `src/MainDashboard.jsx`, `src/DoctorDashboard.jsx`, `src/Register.jsx`, `src/Login.jsx`, `src/Exames.jsx` — componentes críticos
  - `api/ibge-codes.js`, `api/reverse-geocode.js`, `api/unidades.js` — proxies / endpoints

- Sugestões de comandos para criar fixtures (exemplo): colocar scripts em `scripts/seed-qa.js` que usem `supabase-js` para popular as tabelas. (Posso gerar esses scripts se desejar.)

---

## Checklist rápido (QA manual)

- [ ] Registrar novo usuário e verificar `profiles` e `logistica_cliente`.
- [ ] Efetuar login com CPF e verificar redirecionamento.
- [ ] Agendar consulta e verificar `logistica_cliente` e `logistica_medico`.
- [ ] Reagendar consulta e validar remoção/adicionamento dos slots.
- [ ] Visualizar exames em `/exames`.
- [ ] Simular falha de `/api/unidades` e verificar tratamento do erro.

---

## Próximos passos sugeridos

1. Revisar e aprovar este Plano de Teste com a equipe (marcar responsáveis e preencher campos em branco como gerente responsável).
2. Gerar scripts de seed idempotentes para o Supabase QA (posso gerar `scripts/seed-qa.js`).
3. Implementar um conjunto inicial de testes E2E (ex.: Playwright) cobrindo TC001, TC002 e TC003.

---

*Documento gerado automaticamente com base no código e estrutura do repositório `tcc_sus`. Para ajustes, informe quais seções precisam de alteração.*
