# Pendências e ideias (template)

Lista viva do que falta e do que foi pensado para as próximas versões. O desenho do modo em grupo (placar Torre Trick)
tem as pendências dele em [`COLETIVO.md`](COLETIVO.md).

## Onde estamos

**v0.3** publicada em 09/10/2026 (tag `v0.3`, testada no Linux pelos amigos com foco em usabilidade). Entraram nela:
ligação tarefa → avaliação pelo prazo e com várias palavras-chave (`liga()`/`ligaCom()` em `web/motor.js`, com o
`→ P2` e o motivo nos Chefões), aba Torre Trick explicando o modo em grupo, backup em ZIP (`GET /api/backup`, aba Regras),
prêmios reais editáveis com régua de esforço (Masadora; `premios` e `cofreMes` no `estado.json`), lembrete da caixa de
entrada marcado como aplicado pela página, conquistas 000–099 genéricas (gerais + quatro por disciplina, 060 em diante)
e tutoriais do Book (feitiços) e da Masadora que trocam de sub-aba sozinhos (`vai()` em `web/guia.js`).

**Como testar sem mexer nos dados reais:** `python3 servidor.py --porta 8799 --dados PASTA_DE_TESTE --sem-navegador`
e `node ferramentas/navegador.mjs URL roteiro.json` (Firefox headless com perfil próprio; roteiro com `js`, `log`, `shot`).
O `guia.js` roda num escopo fechado: no roteiro, abra o tutorial clicando em `[data-trq]`. Pare o servidor com `pkill`
numa chamada separada. Depois de mexer em `web/`, rode `python3 ferramentas/standalone.py` (gera o `docs/prototipo.html`);
o Pages atualiza a cada push.

**v0.3.1** publicada em 09/10/2026: prioridade no formulário e seta de descer na Lista, e o `IA.md` com o modo agente.

**v0.4 · "atualização da IA"** publicada em 09/10/2026 (tag `v0.4`, falta o teste dos amigos). Entraram nela:
1. **Prioridade das tarefas.** O formulário tem os botões `o jogo decide · A · B · C · sem` (`(A)` digitado no começo do
   texto passa na frente dos botões). "O jogo decide" usa `sugerePri()` em `web/motor.js`: avaliação ligada chegando
   (até 3 dias 50, até 7 dias 35, até 14 dias 15), prazo (até 1 dia 50, até 3 dias 35, até 7 dias 15), chefão em fúria
   20, 2+ atrasadas na disciplina 15, entrega 10; 70+ = A, 40+ = B, 20+ = C. Na Lista, ▲ sobe e ▼ desce (do C, tira a
   prioridade); cada seta some no limite. Pesos **a calibrar** com o uso.
2. **IA integrada ao jogo** (seção abaixo), com *ler todos os planos* e nota em pontos (`4/5`).
3. **Tipos das tarefas na linha do campo** (Lista). O tipo segue a sugestão do texto (`sugereTipo()` em `web/motor.js`,
   listas de palavras em `TIPO_PAL`, ordem entrega > treino e projetos > estudo > faculdade > vida) até o jogador clicar
   num tipo; a prévia diz o motivo ("pela palavra lista"). Cada tipo tem descrição e exemplos ao passar o mouse, o **?**
   abre a tabela "o que encaixa em quê", e com a IA ligada o **IA?** pergunta à IA (`leve: true`: `--model haiku` no
   Claude Code, esforço baixo no Codex, `gemini-2.5-flash` no Gemini). **Treino** virou **treino e projetos**:
   programação e projetos pessoais fora da matéria (ex.: ajudar no desenvolvimento do Hunter.todo). Trabalho e estágio
   continuam em vida, por enquanto.
4. **Codeforces à mão** (ITMO Academy, grupos privados, que a API não enxerga): o ✋ discreto ao lado de "Codeforces" no
   heatmap pede confirmação e soma 1 problema hoje (`POST /api/cf/mao`; `manual` no `cf.json`, somado ao `por_dia` em
   `cf_soma()`). Sem limite nem conferência: vale a palavra do jogador. Conta igual para a meta do dia e o XP; o
   heatmap mostra "(n à mão)" no dia. O aviso tem *desfazer*. No modo em grupo vale o combinado entre amigos.

**v0.4.1** (09/10/2026, ainda da "atualização da IA", depois do teste de um amigo em que a IA não apareceu, mesmo com Codex e Gemini instalados).
Causa: o instalador rodava `servidor.py`, que via o servidor antigo ligado em segundo plano e só abria o navegador; a
página vinha nova (lida do disco) e o servidor ficava velho, sem as rotas da IA. Correções:
- **Troca do servidor antigo** (`troca_antigo()`): versão diferente na porta → reinicia o serviço (systemd, LaunchAgent)
  ou derruba o processo (pid do `/api/ping`, ou `ss`/`lsof` para os antigos) e o novo assume.
- **Servidor se reinicia sozinho** quando o `servidor.py` muda (`vigia_codigo()`, a cada 20 s, com `os.execv`).
- **Aviso amarelo na página** quando a versão do servidor difere da página (`VERSAO_PAGINA` no `index.html`: **mude junto
  com o `VERSAO` do servidor**).
- **IA achada pelo PATH do terminal** (`path_shell()`: o serviço não carrega o `.bashrc`/`.zshrc`), mais pastas do
  cargo, pnpm, yarn, fnm, snap e linuxbrew.
- **Aba Configurações** separada de Regras: seu jogo, IA, servidor, efeitos e backup. Regras ficou só com as regras.
- **✋ do Codeforces também no card "hábitos de hoje"**; "quanto vale" no topo da lateral, ao lado do formulário.
- **Tutoriais:** o da Lista explica o Codeforces automático e o ✋; a aba Configurações tem tutorial próprio; ao ligar
  uma IA aparece "ver o que a IA faz" (tutorial `ia` em `web/guia.js`, que passa por Configurações, Chefões, Lista e
  Book), também no botão *tutorial da IA*.

**v0.4.2** (09/10/2026, ainda da "atualização da IA"):
- **Soma acima de 100%:** no editor do chefão, "pode passar de 100% (pontos extras)" grava `# soma livre: ...` no bloco
  (`LIVRE` em `web/chefes.js`); a validação passa a pedir 100 ou mais, e o pedido da IA avisa que há ponto extra. A vida
  do chefão não fica negativa (`rest` com `Math.max(0, ...)` no motor).
- **Salvar vários planos de uma vez:** em "ler todos os planos", caixa em cada resultado pronto, *selecionar todos* e
  *salvar selecionados* (`aplicaVarios()` em `web/chefes.js`, um POST só). A disciplina que apagaria uma avaliação com
  nota lançada ou não passa na validação fica marcada para revisar no editor.
- **✋ do Codeforces também na Arena** (meta do dia), pelo `cfMaoBtn()` comum às três telas.
- **Hábito semanal acima da meta:** com a meta da semana cumprida, o card "semana completa" tem *fiz de novo*
  (`POST /api/denovo`: o hábito concluído hoje no todo.txt, uma vez por dia, com desfazer). No motor, da (meta+1)ª vez
  na semana em diante vale `HAB_EXTRA` = ×2 (**a calibrar**).

## Planejado para a v0.5

0. **Conquistas criadas pela IA** (desenho combinado com o Caio em 09/10/2026; a primeira coisa a fazer no próximo chat).
   - **A IA só cria, nunca marca.** Ela preenche um molde que o motor confere sozinho: *contagem* ("10 tarefas com a
     palavra sql", "8 entregas de BD no prazo"), *sequência* ("hábito leitura em 14 dias seguidos"), *nota* ("derrotar
     GA com média 8"), *constância* ("Ten de 21 dias"). O tipo de regra vem de uma lista fechada do jogo; a IA escolhe
     o desafio, o número, o nome e o texto no tema.
   - **Onde:** botão "propor conquistas com IA" no Book (só por clique). O pedido leva disciplinas, hábitos, palavras
     das tarefas e o ritmo, e pede de 3 a 5 desafios difíceis mas possíveis. O jogador **aceita as que quiser** (revisão
     como a dos planos de ensino). As aceitas ficam em `conquistas.json` na pasta de dados e aparecem no Book numa
     seção própria (200 em diante); o motor calcula o progresso como nas fixas.
   - **Recompensa (decidido):** o jogador escolhe **Jenny ou um feitiço** quando conquista: os dois botões aparecem
     embaixo da carta, no detalhe da lateral do Book; depois de escolher, a carta mostra **"resgatada"** (claimed). A
     quantia de Jenny e o feitiço oferecido são definidos pelo jogo pela dificuldade, nunca pela IA.
   - **Limite (a confirmar):** no máximo 5 conquistas da IA abertas (não conquistadas) ao mesmo tempo; para pedir
     novas, conquiste ou descarte alguma.
   - **Validade (em aberto):** decidir no fim da temporada se expiram junto com ela ou ficam para sempre. Por enquanto
     só guardar `temporada` em cada conquista criada.

1. Testar Codex e Gemini CLI com a IA ligada (e o Windows: `.cmd` do npm). Os nomes de modelo do pedido leve podem mudar.
2. Calibrar as palavras de `TIPO_PAL` e os pesos do `sugerePri()` com o uso dos amigos.

## Arquivado (decidir depois, em outra temporada)

- **Calendário do Semestre:** os meses da aba Semestre estão fixos (ago/2026 a fev/2027); devem sair da temporada.
- **Temporadas antigas:** o jogo só conhece a temporada atual (carta do semestre de temporadas passadas, histórico).

## IA integrada ao jogo (v0.4)

**Por quê.** Teste de 09/10/2026: um amigo pediu ao Codex "crie as automações que o IA.md exige", e o agente inventou um
controlador em Python, um timer do systemd a cada 15 min, uma skill própria e 35 cartas antigas de uma vez, perguntando
coisas que o jogo deveria decidir. Cada computador ficaria de um jeito. Decisão: **o jogo chama o agente de terminal
que o jogador já tem; a IA só devolve texto, e o jogo confere e grava.**

O que entrou:
- **Configurações → IA** (`iaHTML()` em `web/ia.js`): o servidor acha `claude`, `codex` e `gemini` (PATH + pastas comuns, porque
  o serviço do início automático roda com PATH curto), o jogador escolhe e clica em *testar*. Fica em `jogador.json` →
  `"ia": {"agente", "desde", "cartas"}` (`POST /api/ia/config`; o `/api/config` do assistente preserva o campo).
- **Rota única** `POST /api/ia/rodar {pedido, anexo?}` → `{id}`; a página consulta `GET /api/ia/rodar?id=`. Um pedido por
  vez, 10 min de limite, pasta temporária só com o anexo, pedido pela entrada padrão. Comandos em `comando_agente()`:
  `claude -p --tools Read --permission-mode dontAsk` (testado de verdade), `codex exec --sandbox read-only` e
  `gemini -p` (**não testados**: conferir num computador com eles). Erro de login vira "rode `X` no terminal".
- **Plano de ensino:** pasta `~/.hunter-todo/planos/` (`POST /api/ia/plano` para *enviar arquivo*). No editor do chefão,
  *ler plano com IA* (o arquivo com a sigla ou o nome da disciplina vem escolhido). As linhas `#` da resposta aparecem
  como "Observações da IA" e ficam no bloco como `# (IA) ...` (trocadas a cada nova resposta).
- **Caixa de entrada:** *aplicar lembretes com IA* no editor (o pedido 1 sem anexo); ao salvar, os lembretes ficam aplicados.
- **Mais liberdade no pedido 1:** a IA resolve o que dá para deduzir (`?` + linha `#`) e só deixa de fechar 100 se não
  houver jeito. **Nota em pontos:** a nota aceita `4/5` (`HJ.nota10()` em `web/motor.js`), no quadro e no editor.
- **Cartas sozinhas:** `faltando()` lista os períodos fechados sem carta e com alguma atividade; ao abrir o jogo, as de
  depois de ligar a IA são escritas uma por vez (indicador no canto). As de antes, pelo botão *escrever cartas antigas*.
  Regras fixas: semana fecha na segunda, mês no dia 1, semestre no dia seguinte ao fim, ano em 1º/jan.
- **`IA.md`** (seção "Se o jogador pedir para configurar": proíbe rotinas próprias), **`AGENTS.md`** (+ `CLAUDE.md` que o
  importa): `docs/` não é do jogo.

- **Ler todos os planos** (aba Chefões, card "planos de ensino · IA"): um pedido liga cada arquivo da pasta a uma
  disciplina (`arquivo | SIGLA`, `arquivo | NOVA | sigla | nome` ou `arquivo | NADA`) e depois um pedido por disciplina.
  Cada resultado fica "pronto para revisar": *revisar e salvar* abre o editor com as linhas; disciplina nova abre o
  cadastro de Regras já preenchido (`HJ_GUIA.abreDisciplinas({d, n})`).

O que falta da IA está em "Planejado para a v0.5" e em "Arquivado".

## Ideias para depois (sem versão definida)

1. **Textos pessoais viram escolha do jogador, sem ficar genéricos.** Muitos textos ainda são do jogo pessoal do autor
   (Killua, "transmutação estilo Killua", nomes e falas de personagens). Ideia: o jogador escolhe o personagem favorito
   no começo (assistente) ou compra na loja, e os textos se adaptam a ele. Falta decidir o formato: lista fixa de
   personagens com textos prontos, textos escritos pelo jogador ou textos gerados por IA.
2. **Personagem conselheiro na aba Chefões, só para quem usa IA.** Um personagem de anime que lê as disciplinas, as
   tarefas de cada uma e o plano de ensino e dá dicas soltas. O personagem é escolhido (ou comprado) na loja. A IA
   entra pela rota da seção "IA integrada ao jogo".
3. **Tradução para mais de um idioma.** Textos da página, do assistente, do servidor e dos pedidos para a IA. A opção de
   formato de data (dd/mm ou mm/dd) já existe e serviria de base.
4. **Duolingo, como o Codeforces (ideia de um amigo).** Para quem usa: ligar a conta e o jogo conta os dias de
   Duolingo sozinho (hábito automático, heatmap e conquistas), opcional como o handle do Codeforces. As dificuldades
   (o Duolingo não tem API pública oficial; ver o que dá para ler e se é estável) ficam para avaliar depois.
5. **Ideias guardadas, fora do template para não complicar** (avaliar se interessam aos amigos):
   - gravar o áudio da aula e transcrever no computador, gerando resumo e tarefas (o jogo do autor faz);
   - conferir datas de prova na agenda do Google.

## Técnico

- **Testar no Windows e no Mac:** `instalar.ps1`, início automático (`.vbs` na pasta Inicializar, LaunchAgent no Mac),
  `pythonw` sem janela, boas-vindas no terminal. Precisa de um amigo em cada sistema.
- **GitHub Pages:** no ar em https://caioparanaiba.github.io/todo-engine/ (atualiza a cada push que mexe em `web/`).
- **Fotos de perfil:** as imagens de personagens não vão para o repositório (direitos). Decidir de onde vêm (avatares
  próprios ou livres, ou cada um coloca os seus em `~/.hunter-todo/avatares/`).
- **Testes automáticos** do `servidor.py` (hoje os testes são scripts soltos e o Firefox controlado por script).
- **Aba Lista, bloco "constância":** sobra muito espaço entre os heatmaps (20 semanas) e a borda direita. Avaliar: mais
  semanas conforme a largura, quadradinhos maiores, ou outra coisa ao lado (resumo dos números, por exemplo).

## Renomear para `feito` (decidido em 09/10/2026, fazer depois)

O nome definitivo é **`feito`**: a tarefa feita e o feito (façanha), sem depender do tema. Um repositório só; o servidor
do modo em grupo entra como pasta (`grupo/`, serviço `feito-grupo`). O que muda:

- repositório `todo-engine` → `feito` (o GitHub redireciona o nome antigo; atualizar o link do Pages e do instalador);
- pasta de dados `~/.hunter-todo/` → `~/.feito/`, com **migração automática** (o servidor move a pasta antiga na primeira
  vez) e a variável `HUNTER_DADOS` → `FEITO_DADOS` (aceitar as duas por um tempo);
- serviço do início automático `hunter-todo` → `feito` (desligar o antigo e ligar o novo sem pedir nada ao jogador);
- pasta do instalador `~/todo-engine` → `~/feito`, nome do ZIP de backup e o `server_version`/`app` do `/api/ping`;
- textos "Hunter.todo" na página, no README e no `IA.md`.

Cuidado para não repetir a migração: no código, nomes neutros (`grupo`, `placar`, `moeda`); os nomes do tema
(Associação Hunter, Torre Trick, Trick Coin) ficam só no texto que aparece na tela.
