# IA no Hunter.todo (opcional)

O jogo funciona inteiro sem IA. Ela só poupa digitação em três momentos, e sempre do mesmo jeito: **o jogo monta o pedido
com os seus dados, você cola numa IA qualquer (ChatGPT, Claude, Gemini...) e cola a resposta de volta no jogo.** Nada é
enviado sozinho, e não precisa de conta, chave de API nem programa extra.

| Para quê | Onde fica no jogo | A resposta da IA volta para |
|---|---|---|
| 1. Plano de ensino → provas e trabalhos | **Chefões** → *editar avaliações e notas* → *copiar pedido para a IA* | o mesmo editor (*usar estas linhas*), e você confere e salva |
| 2. Carta narrada da semana, do mês, do semestre ou do ano | **Book** → *Narradas* → *escrever carta com IA* | o mesmo bloco (*adicionar carta*) |
| 3. Anotações de aula → tarefas | **Lista** → *colar várias tarefas de uma vez* → *copiar pedido de aula → tarefas* | o mesmo bloco (*adicionar todas*) |

Se o navegador não deixar copiar sozinho (acontece com a página aberta direto do arquivo), aparece uma janela com o
texto: `Ctrl+A` e `Ctrl+C`.

Os pedidos abaixo são os mesmos que o jogo monta (o código está em `web/ia.js`; ao mudar um, mude o outro). Os trechos
entre `{chaves}` o jogo preenche com os seus dados. As datas saem no formato escolhido na aba Regras (dd/mm/aaaa ou
mm/dd/aaaa); os exemplos abaixo estão em dd/mm/aaaa.

## 1. Plano de ensino → provas e trabalhos

**Como usar:** abra o chefão da disciplina, clique em *copiar pedido para a IA*, cole numa IA e **anexe o PDF do plano de
ensino**. Cole a resposta em *usar estas linhas*, confira pesos e datas e clique em *salvar*.

Também serve quando o plano muda no meio do semestre: o pedido já leva o plano que está no jogo e as mudanças que você
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
- palavra-chave: uma palavra que vai aparecer nas tarefas de estudo dessa avaliação (ex.: integral, avl, sql). Pode ficar vazia.
- contínua: escreva contínua quando forem várias entregas que viram uma média (listas semanais, participação). Senão, deixe vazio.
- Recuperação, prova substitutiva e exame opcional ficam de fora.
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

## 2. Carta narrada

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
Escreva uma carta narrada do meu jogo de tarefas (Hunter.todo, tema Hunter x Hunter) sobre {a semana passada} ({início} a {fim}), com os fatos abaixo.
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

## 3. Anotações de aula → tarefas

**Como usar:** na Lista, abra *colar várias tarefas de uma vez*, clique em *copiar pedido de aula → tarefas*, cole numa
IA e troque o `(cole aqui)` pelas suas anotações da aula. Cole a resposta e clique em
*adicionar todas*. Cada linha vira uma tarefa, com o XP calculado como se você tivesse digitado.

Esse bloco também serve sem IA: dá para colar várias tarefas escritas à mão, uma por linha.

```text
Abaixo estão as minhas anotações de uma aula. Transforme em tarefas para a minha lista no formato todo.txt.
Hoje: {hoje}. Minhas disciplinas: {SIGLA (nome), ...}.

Responda SÓ com as tarefas, uma por linha, sem numeração, sem marcadores e sem texto antes ou depois.
Formato: (A) texto da tarefa +fac.SIGLA tag due:dd/mm/aaaa

Regras:
- tag: {sua tag de entrega} para entregas (trabalho, lista que vale nota) e {sua tag de estudo} para estudo e revisão.
- +fac.SIGLA: a sigla da disciplina da aula, da lista acima.
- due: só quando a aula der uma data (entrega, prova), em dd/mm/aaaa.
- (A), (B) ou (C) no começo só para o que é urgente: prova ou entrega em até 7 dias = (A). Senão, sem prioridade.
- No máximo 5 tarefas, curtas e começando por verbo (Revisar, Fazer, Ler, Entregar).
- Prova ou entrega citada na aula vira a tarefa "Conferir: prova de SIGLA em dd/mm".

Exemplo:
(A) Entregar lista 3 de integrais +fac.CALC2 @entrega due:15/10/2026
Revisar regra da cadeia +fac.CALC2 @estudo

ANOTAÇÕES DA AULA:
(cole aqui)
```

## O que fica de fora (por enquanto)

O jogo original do autor roda com automações agendadas. No template elas viram o copia e cola acima:

| No jogo do autor | No template |
|---|---|
| Caixa de entrada aplicada sozinha às 12h e às 18h | pedido 1, quando você quiser (o pedido leva os lembretes da caixa) |
| Cartas narradas escritas sozinhas toda semana | pedido 2, quando você quiser |

Gravar e transcrever o áudio das aulas e conferir datas de prova na agenda do Google ficaram de fora do template de
propósito, para não complicar. Estão em `docs/PENDENCIAS.md` como ideias a avaliar.
