# Hunter.todo

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda no seu computador, sem conta e quase sem internet: só o Codeforces (se você ligar) e a
conferência de versão nova (uma leitura do GitHub a cada 6 horas) saem do computador.
Precisa apenas do Python 3.8 ou mais novo, no Linux, Windows ou Mac.

> **Versão 0.5.4.** A 0.3 foi testada no Linux por amigos, com foco em usabilidade. No Windows e no Mac ainda não foi testada
> (inclusive o instalador e o início automático): se algo der errado, avise. O que está planejado fica em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md) e ainda não existe.

## Instalação rápida (um comando)

Precisa do Python 3 (veja abaixo como conferir). Abra um terminal e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `curl -fsSL https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.sh \| sh` |
| Windows (PowerShell) | `irm https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.ps1 \| iex` |

Ele baixa o jogo na pasta `todo-engine` dentro da sua pasta de usuário (ou atualiza, se já estiver lá) e abre o jogo. Na
primeira vez, o terminal explica o que é o servidor e pergunta se ele deve **iniciar sempre com o computador**; dizendo
sim, é só abrir http://127.0.0.1:8642/ quando quiser jogar. Rodar o mesmo comando de novo atualiza o jogo (e reinicia o
servidor que estiver em segundo plano; com `git pull`, o servidor percebe o código novo e se reinicia sozinho em até 20 s).

Prefere fazer à mão? Siga os passos abaixo.

## Instalação passo a passo

### 1. Tenha o Python 3

- **Linux:** quase sempre já vem instalado. Confira com `python3 --version`.
- **Mac:** abra o Terminal e rode `python3 --version`. Se não tiver, o próprio Mac oferece instalar.
- **Windows:** baixe em [python.org/downloads](https://www.python.org/downloads/). Na primeira tela do instalador, **marque
  "Add python.exe to PATH"** antes de clicar em Install.

### 2. Baixe o jogo

- **Com git:** `git clone https://github.com/CaioParanaiba/todo-engine.git`
- **Sem git:** no topo desta página, clique em **Code → Download ZIP** e extraia a pasta onde quiser.

### 3. Rode

Abra um terminal **dentro da pasta do jogo** e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `python3 servidor.py` |
| Windows | `py servidor.py` |

No Windows, um jeito fácil de abrir o terminal na pasta certa: abra a pasta no Explorador, clique na barra de endereço,
digite `cmd` e aperte Enter.

O navegador abre sozinho em **http://127.0.0.1:8642/**. Na primeira vez aparece um assistente que pergunta seu nome,
as tags, os hábitos e as disciplinas do semestre, e no fim oferece um tour por cada aba.

**Deixe a janela do terminal aberta enquanto joga.** Para parar, aperte `Ctrl+C` nela. Para jogar de novo, rode o mesmo
comando.

### 4. (Opcional) Iniciar com o computador

Para não precisar rodar o comando toda vez, ligue **"Iniciar com o computador"** na aba **Configurações**. O servidor passa a
rodar em segundo plano (pode fechar o terminal) e a iniciar sozinho quando você liga o PC. Depois é só abrir
**http://127.0.0.1:8642/**; vale salvar nos favoritos. Parado, ele gasta quase nada.

Para desligar, desmarque a mesma opção. Pelo terminal também dá: `python3 servidor.py --instalar` e
`python3 servidor.py --desinstalar` (no Windows, `py` no lugar de `python3`).

Se mudar a pasta do jogo de lugar, desligue e ligue de novo para o início automático achar o caminho novo.

## Onde ficam os seus dados

Tudo o que é seu fica numa pasta separada do código:

| Sistema | Pasta |
|---|---|
| Linux / Mac | `~/.hunter-todo/` |
| Windows | `C:\Users\SEU_USUARIO\.hunter-todo\` |

| Arquivo | O que tem |
|---|---|
| `todo.txt`, `done.txt` | suas tarefas, no formato todo.txt (as concluídas vão para o `done.txt` no dia seguinte) |
| `jogador.json` | nome, tags, hábitos, disciplinas e Codeforces |
| `avaliacoes.txt`, `notas.txt` | plano de avaliação das disciplinas e notas lançadas (o editor do chefão guarda a versão anterior em `.bak`) |
| `narradas.json` | cartas narradas do Book |
| `conquistas.json` | conquistas criadas pela IA (Book, 200 em diante) e o que você resgatou |
| `estado.json` | loja, Jenny gasta e o que está equipado |
| `avatares/` | coloque arquivos PNG aqui para ter mais fotos de perfil |
| `servidor.log` | o que o servidor anotou quando roda em segundo plano |

Para fazer backup, use o botão **baixar meus dados** na aba Configurações (um ZIP da pasta) ou copie a pasta. Para usar outra pasta: `python3 servidor.py --dados CAMINHO`. Se você já tem um todo.txt em outra pasta (com o todo.sh ou outro app), use `--todo PASTA`: o jogo lê e grava o `todo.txt` e o `done.txt` de lá, e o resto continua na pasta de dados.

## Atualizar

O jogo confere sozinho se saiu versão nova e avisa na aba **Novidades** (com um ponto amarelo no menu). Lá, o botão
**atualizar agora** baixa a versão nova (pelo git ou, sem git, pelo ZIP do GitHub) e reinicia o jogo. A mesma aba
explica o que mudou em cada versão.

À mão também dá:

- **Com git:** `git pull` dentro da pasta do jogo.
- **Sem git:** rode de novo o comando da instalação rápida (ele baixa por cima) ou baixe o ZIP e substitua a pasta do jogo.

Atualizar nunca mexe nos seus dados, porque eles ficam fora da pasta do código.

## Sem instalar: modo demonstração

**Online:** https://caioparanaiba.github.io/todo-engine/ (atualiza sozinho a cada mudança na página).
**No computador:** abra o arquivo `web/index.html` direto no navegador (dois cliques).

Entra um jogador de exemplo, com histórico, e nada é gravado: recarregar a página volta ao começo.

## Problemas comuns

- **"python3 não é reconhecido" / "py não é reconhecido" (Windows):** o Python foi instalado sem marcar "Add to PATH".
  Rode o instalador de novo, escolha **Modify** e marque a opção.
- **"A porta 8642 está ocupada":** outro programa usa essa porta. Rode com outra: `python3 servidor.py --porta 8643`.
- **O navegador não abriu:** abra http://127.0.0.1:8642/ à mão.
- **Aviso amarelo "o servidor do jogo ainda está na versão...":** o servidor antigo continua ligado. Rode o instalador de
  novo ou reinicie o computador (Linux: `systemctl --user restart hunter-todo`) e recarregue a página.
- **A IA não aparece em Configurações → IA:** instale e entre na conta da IA pelo terminal (`codex login`, `claude`,
  `gemini`) e clique em **procurar de novo**. O jogo procura no PATH do seu terminal e nas pastas comuns (npm, nvm, ~/.local/bin).
- **Esqueci de marcar um hábito ontem:** no card "hábitos de hoje", clique em **esqueci de marcar ontem**. Ele conta
  para ontem (XP, Ten e heatmap). Só vale para o dia anterior.
- **Codeforces não conta:** confira o handle na aba Configurações. A contagem atualiza a cada 10 minutos e precisa de internet.
  Problema feito onde a API não enxerga (ITMO Academy, contest de grupo privado): clique no ✋ ao lado de "Codeforces" no
  heatmap da Lista e confirme; cada confirmação soma 1 problema hoje.
- **Não sei qual tipo escolher para a tarefa:** o jogo sugere pelas palavras do texto; o **?** ao lado dos tipos mostra o
  que encaixa em quê, e com a IA ligada o **IA?** pergunta a ela.

## Como funciona por dentro

- `servidor.py`: servidor local (só a biblioteca padrão do Python). Lê e grava os seus arquivos, cria os hábitos de cada dia
  e consulta o Codeforces. Só aceita conexões do próprio computador.
- `web/index.html`: a página do jogo. `web/motor.js`: todas as regras e contas. `web/guia.js`: assistente e tutorial.
  `web/chefes.js`: editor de avaliações e notas. `web/ia.js`: pedidos para a IA e a IA ligada. `web/conquistas.js`:
  conquistas criadas pela IA (as regras ficam no motor). `web/novidades.js`: aba Novidades, com a lista de versões que o
  servidor lê do GitHub para avisar de versão nova (ao lançar uma, ponha-a no topo). `web/feedback.js`: bug, ideia ou
  dúvida vira uma issue preenchida pelos formulários de `.github/ISSUE_TEMPLATE/`. `web/efeitos.js`: o que os itens
  da Masadora fazem na tela (texturas, molduras, fontes, animações e sons; os itens e preços ficam no `COS` do motor). `web/demo.js`: o servidor de mentira do
  modo demonstração (também usado no GitHub Pages).
- **IA opcional.** O jogo funciona sem IA. Com uma IA de terminal instalada (Claude Code, Codex ou Gemini CLI), ligue-a
  em **Configurações → IA**: o jogo passa a ler os planos de ensino (pasta `~/.hunter-todo/planos/`), aplicar a caixa de entrada
  e escrever as cartas do Book sozinho, e propõe conquistas feitas para você (no Book); você confere antes de salvar. Sem ela, o jogo monta os pedidos e você cola
  numa IA de chat. Veja [`IA.md`](IA.md).

## Versões

| Versão | Nome | O que trouxe |
|---|---|---|
| 0.5.4 | atualização das conquistas | Masadora com 40 itens novos: efeitos ao concluir tarefa, sons sintetizados, fontes, paletas, texturas, molduras e quatro temas completos (`web/efeitos.js`) |
| 0.5.3 | atualização das conquistas | XP dos dias passados guardado (linha concluída que some não tira mais XP); nota corrigida para menos não deixa a carteira negativa |
| 0.5.2 | atualização das conquistas | bônus de nota e fúria guardados: mudar o plano não tira mais Jenny nem XP; carteira negativa zerada uma vez |
| 0.5.1 | atualização das conquistas | feedback pelo jogo: bug, ideia ou dúvida vira uma issue já preenchida no GitHub (balão no canto da tela) |
| 0.5 | **atualização das conquistas** | conquistas criadas pela IA (recompensa em Jenny ou feitiço), aba Novidades com aviso de versão nova e atualizar com um clique, instalador sem git que atualiza |
| 0.4 · 0.4.1 · 0.4.2 | **atualização da IA** | IA de terminal ligada no próprio jogo (planos de ensino, caixa de entrada, cartas do Book, tipo da tarefa), tipos ao lado do campo, Codeforces à mão, aba Configurações, pesos acima de 100%, salvar vários planos de uma vez, "fiz de novo" nos hábitos semanais |
| 0.3 · 0.3.1 | | ligação tarefa → avaliação, Torre Trick (explicação), backup, prêmios reais, prioridade sugerida |
| 0.2 | | hábitos semanais, editor de avaliações e notas, instalador de um comando |

O que vem depois está em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).

## Licença

[MIT](LICENSE): pode usar, modificar e distribuir, mantendo o aviso de copyright.
