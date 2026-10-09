# IA no Hunter.todo (opcional)

O jogo funciona inteiro sem IA. Com IA, você digita menos: ela monta o plano de avaliação a partir do plano de ensino,
aplica as mudanças da caixa de entrada, cuida das suas tarefas e escreve as cartas do Book.

Há três jeitos de usar:

| Jeito | Exemplos | Como funciona |
|---|---|---|
| **IA ligada no jogo** (recomendado) | Codex, Claude Code, Gemini CLI instalados no computador | Aba **Configurações → IA**: o jogo acha a IA instalada e você liga com um clique. Os botões do jogo chamam a IA sozinhos. |
| **IA de chat** (só conversa) | ChatGPT, Claude, Gemini no navegador | O jogo monta o pedido, você cola na IA e cola a resposta de volta. |
| **Conversar com a IA de terminal** | os mesmos da primeira linha | Abra-a na pasta do jogo e peça coisas soltas: *"adie a lista para sexta"*, *"tirei 4 de 5 na P1 de CALC2"*. |

**IA ligada no jogo.** Instale uma IA de terminal, entre na conta dela pelo terminal uma vez e, no jogo, vá em
**Configurações → IA**, escolha a IA e clique em **testar**. A partir daí:

- **Plano de ensino:** ponha os PDFs em `~/.hunter-todo/planos/` (ou use *enviar arquivo* no editor do chefão). Em
  **Chefões**, *ler todos os planos* liga cada arquivo à disciplina, lê um por um e deixa cada resultado para você
  revisar e salvar (disciplina ainda não cadastrada vira o botão *cadastrar*). Para uma só, *ler plano com IA* no
  editor da disciplina.
- **Tipo da tarefa:** no formulário da Lista, o botão *IA?* pergunta à IA qual tipo combina (pedido curto, com o modelo
  mais leve). Sem IA, o jogo sugere pelas palavras e o *?* mostra o que encaixa em quê.
- **Caixa de entrada:** no editor da disciplina, *aplicar lembretes com IA*. Ao salvar, os lembretes ficam marcados
  como aplicados.
- **Cartas do Book:** as que faltam são escritas sozinhas quando você abre o jogo (semana fechada na segunda, mês no
  dia 1, semestre no dia seguinte ao fim da temporada, ano em 1º de janeiro). As de antes de ligar a IA saem pelo
  botão *escrever cartas antigas* no Book. Dá para desligar as automáticas em Configurações.

A IA só devolve texto e não tem permissão para gravar nada: quem confere e grava é o jogo. Os dados de cada pedido vão
para a empresa da IA escolhida.

**Com IA de chat:** veja [Modo chat](#modo-chat-os-pedidos-do-jogo) no fim deste arquivo.

---

## Para a IA: comece aqui

Você está ajudando um jogador do **Hunter.todo**, um jogo local que transforma a lista de tarefas (formato todo.txt) em
RPG com tema Hunter x Hunter. **Tudo o que você precisa está neste arquivo.** Não precisa ler o `servidor.py` nem o
código da página para entender os dados ou como gravar.

**Na primeira resposta**, seja curto: em até 5 linhas, diga o que você pode fazer (tabela abaixo) e pergunte o que o
jogador quer. Não repita este arquivo para ele. Se a IA ainda não está ligada no jogo (`jogador.json` sem `"ia"` ou com
`"agente": "chat"`), diga numa linha que dá para ligar em **Configurações → IA**, para os botões do jogo usarem você sozinhos.

**Qual modo usar:** se você consegue rodar comandos ou ler arquivos neste computador, use o **modo agente** (logo
abaixo). Se não, use o **modo chat** (no fim): o jogador cola um pedido do jogo e você responde só no formato pedido.

### O que você pode e o que não pode fazer

| Pode | Não pode |
|---|---|
| Ler tarefas, hábitos, disciplinas, avaliações, notas, caixa de entrada e cartas | Calcular ou gravar XP, andar, Ten, Jenny ou nível: o jogo calcula sozinho a partir das tarefas |
| Adicionar, editar, adiar e mudar a prioridade de tarefas | Concluir tarefa ou hábito que o jogador não disse que fez |
| Montar e atualizar o plano de avaliação de uma disciplina já cadastrada | Mexer no `estado.json` (loja, carteira, feitiços): é trapaça e quebra o jogo |
| Lançar notas que o jogador informou | Inventar data, peso, nota ou acontecimento |
| Aplicar a caixa de entrada e marcar o lembrete como aplicado | Apagar o histórico (`done.txt`) |
| Escrever cartas narradas no Book | Criar ou remover disciplina, hábito ou mudar o semestre: peça ao jogador para usar a aba **Configurações** |

**O que o jogo não tem** (diga isso em vez de improvisar e não ofereça): aulas de qualquer tipo (cadastrar aula,
grade horária, transformar anotações, áudio ou transcrição de aula em tarefas), agenda do Google, lembretes por
notificação.

### Se o jogador pedir para "configurar", "automatizar" ou "instalar" a IA

**Não crie nada:** nada de rotina agendada, timer, cron, serviço do sistema, skill, script ou programa próprio. A
automação já vem no jogo, e cada computador precisa ficar igual para dar suporte. Responda em poucas linhas:

1. Confira se o servidor está ligado (`/api/ping`) e diga ao jogador para abrir **Configurações → IA**, escolher a IA dele e
   clicar em **testar**. Se o teste acusar falta de login, mostre o comando de login da IA.
2. Explique o que passa a acontecer sozinho: as cartas do Book que faltam, ao abrir o jogo (semana na segunda, mês no
   dia 1, semestre no dia seguinte ao fim da temporada, ano em 1º/jan). Não pergunte essas datas: são regras do jogo.
3. Explique onde ficam os botões: *ler todos os planos* em Chefões, *ler plano com IA* e *aplicar lembretes com IA* no
   editor de cada chefão, *IA?* no formulário da Lista e *escrever cartas antigas* no Book. Os planos de ensino ficam em `~/.hunter-todo/planos/`.

O resto do modo agente (abaixo) serve para os pedidos soltos que o jogador fizer na conversa.

---

## Modo agente

### 1. Onde estão os dados

- **Pasta de dados:** `~/.hunter-todo/` (ou a da variável `HUNTER_DADOS`). No Windows: `%USERPROFILE%\.hunter-todo\`.
- **Código do jogo:** a pasta deste arquivo. Não guarde nada do jogador nela.
- **Servidor:** `http://127.0.0.1:8642` (ou a porta da variável `HUNTER_PORTA`).

| Arquivo | O que tem | Você pode |
|---|---|---|
| `todo.txt` | tarefas abertas (e as concluídas hoje) | adicionar e editar, **pela API** |
| `done.txt` | tarefas concluídas de dias anteriores | só ler |
| `avaliacoes.txt` | semestre, disciplinas (chefões) e avaliações de cada uma | editar o bloco de uma disciplina |
| `notas.txt` | notas lançadas | acrescentar |
| `ajustes.txt` | caixa de entrada (lembretes de mudança) | marcar como aplicado |
| `narradas.json` | cartas do Book | acrescentar, **pela API** |
| `planos/` | planos de ensino (PDF, HTML...) | ler |
| `jogador.json` | nome, tags, hábitos, disciplinas, Codeforces, formato de data, IA ligada (`ia`) | só ler |
| `estado.json`, `cf.json` | loja, carteira; cache do Codeforces | não mexer |

### 2. Como ler e gravar

**Sempre comece conferindo se o servidor está ligado:**

```sh
curl -s http://127.0.0.1:8642/api/ping          # {"ok": true, "app": "hunter-todo", ...}
```

**Servidor ligado: grave só pela API.** Ela segura a trava do arquivo (a página pode estar gravando ao mesmo tempo),
guarda o "desfazer" da página e faz `.bak` do plano. Toda gravação é um `POST` com JSON e o cabeçalho `X-Painel: 1`:

```sh
curl -s -X POST http://127.0.0.1:8642/api/add -H 'X-Painel: 1' -H 'Content-Type: application/json' \
     -d '{"text": "Revisar regra da cadeia +fac.CALC2 @estudo due:2026-10-15"}'
```

No Windows, use `curl.exe` (no PowerShell, `curl` sozinho é outro comando) e aspas duplas escapadas no JSON, ou
`Invoke-RestMethod -Method Post -Headers @{'X-Painel'='1'} -ContentType 'application/json' -Body '{...}'`.

| Rota | Corpo (JSON) | Para quê |
|---|---|---|
| `GET /api/jogo` | — | tudo de uma vez: `todo`, `done` (listas de linhas), `avaliacoes`, `notas`, `ajustes` (texto), `narradas`, `jogador`, `hoje` |
| `POST /api/add` | `{"text": "linha"}` | nova tarefa (o jogo põe a data de criação) |
| `POST /api/act` | `{"raw": "linha exata", "action": "...", "value": "..."}` | mexe numa tarefa: `edit` (value = novo texto, sem prioridade nem data de criação), `up`, `down`, `d1` (adia 1 dia), `setdate` (value = data), `rmdue`, `delete`, `done` (só se o jogador pediu) |
| `POST /api/jogo/planos` | `{"avaliacoes": "arquivo inteiro"}` | grava o `avaliacoes.txt` (o anterior vai para `.bak`). Pode mandar `"notas"` junto |
| `POST /api/jogo/nota` | `{"disc": "CALC2", "aval": "P1", "nota": 7.5, "parcial": false}` | lança uma nota (0 a 10). `parcial: true` = uma das entregas de uma avaliação contínua |
| `POST /api/jogo/ajuste` | `{"quando": "...", "texto": "...", "aplicado": true}` | marca um lembrete da caixa de entrada como aplicado (`quando` e `texto` exatamente como no arquivo) |
| `POST /api/jogo/narrada` | `{"carta": {...}}` | grava uma carta no Book (formato na seção 3) |

Resposta de sucesso: `{"ok": true}`. Erro: `{"ok": false, "error": "motivo"}`. Leia o motivo e corrija; não tente
gravar o arquivo por fora.

**Servidor desligado:** peça ao jogador para abrir o jogo, ou ligue você mesmo em segundo plano (o comando não
termina sozinho) com `python3 servidor.py --sem-navegador &` (Windows: `start /b py servidor.py --sem-navegador`), rodado na
pasta do jogo. Só edite
os arquivos direto se isso não for possível, e antes copie o arquivo para `NOME.bak`.

**Depois de gravar:** diga ao jogador o que mudou, em poucas linhas, e que basta recarregar a página (F5).

### 3. Formatos

**Datas nos arquivos são sempre `AAAA-MM-DD`.** Para o jogador, escreva no formato que ele usa: `jogador.json` →
`"datas": "mdy"` é mm/dd/aaaa; sem esse campo, dd/mm/aaaa. **Para gravar, use sempre `AAAA-MM-DD`** (a API também
aceita `hoje`, `amanha` e `+3`; já `15/10` é lido no formato do jogador e pode virar outra data).

**Tarefa (`todo.txt`)** — uma por linha:

```text
(A) 2026-10-09 Entregar lista 3 de integrais +fac.CALC2 @entrega due:2026-10-15
```

- `(A)`, `(B)`, `(C)`: prioridade (opcional). `(A)` = prova ou entrega em até 7 dias; o resto, em geral, sem prioridade.
- a data logo depois é a de criação (o jogo põe sozinho no `/api/add`; não escreva).
- `+fac.SIGLA`: liga a tarefa à disciplina (a sigla do `avaliacoes.txt`).
- tags: as do jogador estão em `jogador.json` → `tags` (`ent` = entrega, `est` = estudo, `tre` = treino e projetos de
  programação, inclusive pessoais, `hab` = hábito). Faculdade sem entrega nem estudo = só `+fac.SIGLA`; o resto (casa,
  saúde, documentos, trabalho) fica sem tag. Sem tag do jogador, use `@entrega` e `@estudo`. **A tag muda o XP**: entrega vale mais que estudo.
- `due:` prazo. Só ponha quando houver uma data de verdade.
- `av:CHAVE` (opcional): liga a tarefa a uma avaliação específica (ex.: `av:P2`). Sem isso, o jogo liga pelas
  palavras-chave e pela data.
- **não crie nem edite** linhas com `rec:` (hábitos e Codeforces: o servidor cria todo dia).
- texto curto, começando por verbo (Revisar, Fazer, Ler, Entregar).

**Plano de avaliação (`avaliacoes.txt`):**

```text
temporada | 2026-2 | 2026-08-03 | 2026-12-12 | 2027-02-01

[CALC2] Uvogin | bullet | Força bruta, como uma lista de integrais.
P1 | Prova 1 | 30 | 2026-09-22 | limite |
L | Listas | 20 | 2026-11-30 | lista | contínua
P2 | Prova 2 | 50 | 2026-12-01? | |
```

- `temporada | nome | início | fim do semestre | volta às aulas`: não mexa.
- `[SIGLA] chefão | ícone | frase`: o cabeçalho da disciplina. **Mantenha como está**; troque só as linhas de baixo.
- `chave | nome | peso | data | palavras-chave | contínua`:
  - **chave**: 1 a 8 letras ou números (P1, T1, L). **As notas se ligam pela chave**: ao atualizar um plano, mantenha
    as chaves que já existem, senão a nota lançada some do chefão.
  - **peso**: % da nota final, só o número. Os pesos da disciplina somam 100. Se o plano usar fórmula (ex.:
    NF = 0,4·N1 + 0,6·N2, com N1 = média de P1 e T1), faça a conta até o peso de cada avaliação na nota final.
  - **data**: `AAAA-MM-DD`. Estimada (o plano só diz a semana ou a aula) leva `?` no fim. Peso incerto também (`20?`).
  - **palavras-chave**: 1 a 3 palavras que aparecem nas tarefas só dessa avaliação, separadas por vírgula. Pode ficar
    vazio.
  - **contínua**: várias entregas que viram uma média (listas semanais, participação). Senão, vazio.
  - Recuperação, prova substitutiva e exame opcional ficam de fora.
  - **Nota em pontos** (a P1 vale 5 de 10): o peso continua sendo quanto ela vale na nota final; anote numa linha `#`
    quanto cada avaliação vale, para o jogador lançar como `4/5`.
- Linhas com `#` são comentários: use para anotar dúvidas (ex.: `# peso da P2 não está claro no plano`).

**Notas (`notas.txt`):** `2026-09-25 | CALC2 | P1 | 7,5` e, para cada entrega de uma contínua,
`... | L | 8 | parcial`. Use a rota `/api/jogo/nota`. A nota é sempre de 0 a 10: se o plano dá a avaliação em pontos
("tirei 4 de 5"), converta (4 / 5 × 10 = 8). Na página, o jogador pode digitar `4/5` direto.

**Caixa de entrada (`ajustes.txt`):** `2026-10-08 14:30 | pendente | P2 de CALC2 passou para 03/12`. Depois de
aplicar, a mesma linha vira `aplicado`.

**Carta narrada** (rota `/api/jogo/narrada`):

```json
{"tipo": "semana", "periodo": "2026-W40", "titulo": "...", "ic": "moon", "cronica": "...", "texto": "..."}
```

- `tipo` e `periodo`: `semana` + `AAAA-Wnn` (semana ISO, de segunda a domingo) · `mes` + `AAAA-MM` · `semestre` +
  o nome da temporada (`2026-2`) · `ano` + `AAAA`. Uma carta nova do mesmo período substitui a anterior.
- `ic`: um destes: `int tra con esp man emi spider tower card flame moon island crown scroll`.
- tamanhos e regras do texto: os mesmos do pedido 2 do [modo chat](#2-carta-narrada).

### 4. Receitas

**Plano de ensino → avaliações.** O jogador manda o PDF (ou o caminho dele) e diz a disciplina.
1. `GET /api/jogo`; ache o bloco `[SIGLA]` no `avaliacoes`. Se a disciplina não existe, peça para cadastrá-la em
   **Configurações** antes.
2. Leia o plano de ensino e monte as linhas (regras do formato acima). Mantenha as chaves que já existem.
3. Resolva sozinho o que dá para deduzir (fórmula → pesos, data pela semana, regra confusa): marque com `?` e explique
   numa linha `# ...`. Só pergunte se não der para fechar 100 ou se o plano se contradiz de um jeito que muda muito a
   nota. Depois, **mostre as linhas ao jogador e espere o ok** (pesos e datas mudam a nota que falta em cada chefão).
4. Troque só as linhas daquele bloco, mande o arquivo inteiro em `/api/jogo/planos` e conte o que mudou
   (ex.: "P2 mudou de 01/12 para 03/12; a soma dos pesos é 100").

**Aplicar a caixa de entrada.**
1. `GET /api/jogo`; pegue as linhas `pendente` do `ajustes`.
2. Para cada uma, diga o que vai mudar (avaliação, tarefa ou as duas) e espere o ok. Se o lembrete for ambíguo,
   pergunte em vez de adivinhar.
3. Grave (`/api/jogo/planos`, `/api/act` ou `/api/add`) e marque o lembrete com `/api/jogo/ajuste`.

**Lançar nota.** O jogador diz "tirei 7,5 na P1 de CALC2": confira se a chave existe no plano e use
`/api/jogo/nota`. Se não existir, pergunte qual é a avaliação.

**Carta narrada.** Os fatos vêm do `done` (linhas `x DATA ...` dentro do período) e do `notas`. Hábitos são as
linhas com `rec:`; o Codeforces está em `cf.json` → `por_dia` (mais `manual`, os marcados à mão). **Não calcule XP, Ten nem andar**: se quiser esses
números, peça ao jogador para copiar o pedido em **Book → Narradas** (ele já traz tudo) ou escreva sem eles. Não
precisa pedir ok antes de gravar uma carta: ela não muda pontuação, e o jogador pode pedir outra.

**Tarefas no dia a dia** ("adie a lista para sexta", "suba a prioridade do trabalho"): ache a linha exata no `todo`
e use `/api/act`. Se houver mais de uma parecida, pergunte qual.

### 5. Regras de ouro

1. Antes de mudar plano, notas ou várias tarefas de uma vez, **mostre o que vai mudar e espere o ok**. Uma tarefa
   avulsa que o jogador ditou pode ir direto.
2. Nunca invente fato: o que você deduziu leva `?` e uma linha `#` explicando; o que não dá para deduzir, pergunte.
3. Depois de gravar, resuma o que mudou e lembre de recarregar a página.
4. Responda no idioma e com as datas no formato do jogador.

---

## Modo chat: os pedidos do jogo

Em todos os pedidos, **o jogo monta o texto com os seus dados, você cola numa IA qualquer e cola a resposta de volta no
jogo.** Nada é enviado sozinho, e não precisa de conta, chave de API nem programa extra.

| Para quê | Onde fica no jogo | A resposta da IA volta para |
|---|---|---|
| 1. Plano de ensino → provas e trabalhos (e lembretes da caixa de entrada) | **Chefões** → *editar avaliações e notas* → *copiar pedido para a IA* | o mesmo editor (*usar estas linhas*), e você confere e salva |
| 2. Carta narrada da semana, do mês, do semestre ou do ano | **Book** → *Narradas* → *escrever carta com IA* | o mesmo bloco (*adicionar carta*) |

Se o navegador não deixar copiar sozinho (acontece com a página aberta direto do arquivo), aparece uma janela com o
texto: `Ctrl+A` e `Ctrl+C`.

**Para a IA de chat:** quando receber um destes pedidos, responda **só** no formato que ele pede, sem explicação
antes ou depois (o jogo lê a resposta direto). Dúvidas vão dentro do formato (linha com `#` no plano de avaliação).

Com a IA ligada no jogo (Configurações → IA), os botões mandam estes mesmos pedidos para a IA de terminal, e a resposta cai no
mesmo lugar. Os pedidos abaixo são os mesmos que o jogo monta (o código está em `web/ia.js`; ao mudar um, mude o outro). Os trechos
entre `{chaves}` o jogo preenche com os seus dados. As datas saem no formato escolhido na aba Configurações (dd/mm/aaaa ou
mm/dd/aaaa); os exemplos abaixo estão em dd/mm/aaaa.

### 1. Plano de ensino → provas e trabalhos

**Como usar:** abra o chefão da disciplina, clique em *copiar pedido para a IA*, cole numa IA e **anexe o PDF do plano de
ensino**. Cole a resposta em *usar estas linhas*, confira pesos e datas e clique em *salvar*.

Sem o PDF, o mesmo pedido aplica os lembretes da caixa de entrada (com a IA ligada, é o botão *aplicar lembretes com
IA*; a primeira linha passa a ser "Atualize o plano de avaliação da disciplina {SIGLA} ({nome}) do meu jogo de tarefas
com as mudanças que o professor avisou (no fim deste pedido)."). Também serve quando o plano muda no meio do semestre: o pedido já leva o plano que está no jogo e as mudanças que você
anotou na caixa de entrada sobre aquela disciplina. Notas lançadas continuam valendo enquanto a chave da avaliação for a
mesma.

```text
Leia o plano de ensino em anexo e monte o plano de avaliação da disciplina {SIGLA} ({nome}) para o meu jogo de tarefas.
Semestre: {início} a {fim}. Hoje: {hoje}.

Responda SÓ com linhas neste formato, uma por avaliação, sem texto antes ou depois, sem tabela e sem markdown:
chave | nome da avaliação | peso | data | palavra-chave | contínua

Regras:
- chave: de 1 a 8 letras ou números, sem espaço (ex.: P1, P2, T1, L).
- peso: quanto a avaliação vale na nota final, em %, só o número. Os pesos somam 100. Se o plano usar fórmula (ex.: NF = 0,4·N1 + 0,6·N2, com N1 = média de P1 e T1), faça a conta para chegar ao peso de cada avaliação na nota final.
- data: dd/mm/aaaa. Sem data exata no plano, estime pela semana ou aula indicada e ponha ? no fim (ex.: 15/10/2026?). Peso incerto também leva ? (ex.: 20?).
- palavra-chave: de 1 a 3 palavras que vão aparecer nas tarefas de estudo só dessa avaliação, separadas por vírgula (ex.: integral, derivada). Pode ficar vazia.
- contínua: escreva contínua quando forem várias entregas que viram uma média (listas semanais, participação). Senão, deixe vazio.
- Nota em pontos (ex.: a P1 vale 5 pontos de 10): o peso continua sendo quanto ela vale na nota final, e avise numa linha # quanto cada avaliação vale (eu lanço a nota como 4/5 e o jogo converte).
- Recuperação, prova substitutiva e exame opcional ficam de fora.
- Resolva sozinho o que dá para deduzir (fórmula, data pela semana, regra confusa): marque com ? e explique numa linha #. Se não der para fechar 100, mande as linhas mesmo assim e diga numa linha # o que falta.
- Para me avisar de algo (dúvida, regra especial), use uma linha começando com #.

Exemplo de resposta:
P1 | Prova 1 | 30 | 22/09/2026 | limite |
L | Listas | 20 | 30/11/2026 | lista | contínua
P2 | Prova 2 | 50 | 01/12/2026? | |

Plano que está hoje no jogo (atualize-o com o plano de ensino e com as mudanças abaixo, se houver):
{as avaliações atuais da disciplina}

Mudanças que o professor avisou (anotadas na caixa de entrada):
{os lembretes pendentes da caixa de entrada que citam a sigla}
```

### 2. Carta narrada

**Como usar:** no Book, aba *Narradas*, escolha o período (*semana passada*, *mês passado*, *semestre* depois que ele
acaba, *ano passado*), clique em *copiar pedido* e cole numa IA. Cole a resposta em *adicionar carta*. Uma carta nova
do mesmo período substitui a anterior.

O pedido já leva os fatos do período: tarefas concluídas com data, hábitos, Codeforces, notas, XP, Ten e andar. No
semestre e no ano vão também os chefões e as cartas do nível de baixo (o mês parte das semanais, e assim por diante).

| Tipo | Texto (factual) | Crônica (narrada) |
|---|---|---|
| semana | até 90 palavras | até 80 |
| mês | até 150 | até 160 |
| semestre | até 250 | até 300 |
| ano | até 400 | até 600 |

```text
Escreva uma carta narrada do meu jogo de tarefas (Hunter.todo, tema Hunter x Hunter) sobre {a semana} de {início} a {fim}, com os fatos abaixo.
Responda SÓ com um objeto JSON, sem texto antes ou depois e sem markdown:
{"tipo": "{tipo}", "periodo": "{período}", "titulo": "...", "ic": "...", "cronica": "...", "texto": "..."}

Regras:
- texto: a parte factual, o que aconteceu, em tom sóbrio e caloroso. Até {N} palavras. Datas e números exatos, tirados dos dados.
- cronica: o mesmo período contado como um capítulo de Hunter x Hunter (Nen, Ten, Zetsu, a Arena Celestial, os chefões do Genei Ryodan). Pode dramatizar a forma, mas todo acontecimento citado é real e está nos dados. Até {M} palavras.
- titulo: curto e próprio.
- ic: um destes ícones: int tra con esp man emi spider tower card flame moon island crown scroll.
- Nunca invente fato, sentimento ou motivo. Dia sem tarefa não quer dizer dia parado. Sem julgamento nem cobrança.
- Separe parágrafos com \n\n dentro do JSON.

DADOS
{período, jogador, XP, Ten, andar, tarefas concluídas, hábitos, Codeforces, notas, chefões, cartas do nível de baixo}
```
