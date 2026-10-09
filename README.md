# Hunter.todo

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda no seu computador, sem conta e sem internet (só o Codeforces, se você ligar, consulta a API).
Precisa apenas do Python 3.8 ou mais novo, no Linux, Windows ou Mac.

> **Versão 0.2 (teste).** Testada no Linux. No Windows e no Mac ainda não foi testada (inclusive o instalador e o
> início automático): se algo der errado, avise. O que está planejado fica em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md) e ainda não existe.

## Instalação rápida (um comando)

Precisa do Python 3 (veja abaixo como conferir). Abra um terminal e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `curl -fsSL https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.sh \| sh` |
| Windows (PowerShell) | `irm https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.ps1 \| iex` |

Ele baixa o jogo na pasta `todo-engine` dentro da sua pasta de usuário (ou atualiza, se já estiver lá) e abre o jogo. Na
primeira vez, o terminal explica o que é o servidor e pergunta se ele deve **iniciar sempre com o computador**; dizendo
sim, é só abrir http://127.0.0.1:8642/ quando quiser jogar. Rodar o mesmo comando de novo atualiza o jogo.

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

Para não precisar rodar o comando toda vez, ligue **"Iniciar com o computador"** na aba **Regras**. O servidor passa a
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
| `estado.json` | loja, Jenny gasta e o que está equipado |
| `avatares/` | coloque arquivos PNG aqui para ter mais fotos de perfil |
| `servidor.log` | o que o servidor anotou quando roda em segundo plano |

Para fazer backup, use o botão **baixar meus dados** na aba Regras (um ZIP da pasta) ou copie a pasta. Para usar outra pasta: `python3 servidor.py --dados CAMINHO`.

## Atualizar

- **Com git:** `git pull` dentro da pasta do jogo.
- **Sem git:** baixe o ZIP de novo e substitua a pasta do jogo.

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
- **Esqueci de marcar um hábito ontem:** no card "hábitos de hoje", clique em **esqueci de marcar ontem**. Ele conta
  para ontem (XP, Ten e heatmap). Só vale para o dia anterior.
- **Codeforces não conta:** confira o handle na aba Regras. A contagem atualiza a cada 10 minutos e precisa de internet.

## Como funciona por dentro

- `servidor.py`: servidor local (só a biblioteca padrão do Python). Lê e grava os seus arquivos, cria os hábitos de cada dia
  e consulta o Codeforces. Só aceita conexões do próprio computador.
- `web/index.html`: a página do jogo. `web/motor.js`: todas as regras e contas. `web/guia.js`: assistente e tutorial.
  `web/chefes.js`: editor de avaliações e notas. `web/ia.js`: pedidos para a IA. `web/demo.js`: o servidor de mentira do
  modo demonstração (também usado no GitHub Pages).
- **IA opcional.** O jogo funciona sem IA. Com uma IA qualquer, o jogo monta os pedidos (plano de ensino → provas e
  trabalhos, cartas narradas, anotações de aula → tarefas) e você cola a resposta de volta. Veja [`IA.md`](IA.md).

## Licença

[MIT](LICENSE): pode usar, modificar e distribuir, mantendo o aviso de copyright.
