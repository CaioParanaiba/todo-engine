# Hunter.todo

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda no seu computador, sem conta e sem internet (só o Codeforces, se você ligar, consulta a API).
Precisa apenas do Python 3.8 ou mais novo, no Linux, Windows ou Mac.

> **Versão 0.1 (teste).** Testada no Linux. No Windows e no Mac ainda não foi testada: se algo der errado, avise.
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md) e ainda não existe.

## Instalação

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
| `avaliacoes.txt`, `notas.txt` | plano de avaliação das disciplinas e notas lançadas |
| `estado.json` | loja, Jenny gasta e o que está equipado |
| `avatares/` | coloque arquivos PNG aqui para ter mais fotos de perfil |

Para fazer backup, copie essa pasta. Para usar outra pasta: `python3 servidor.py --dados CAMINHO`.

## Atualizar

- **Com git:** `git pull` dentro da pasta do jogo.
- **Sem git:** baixe o ZIP de novo e substitua a pasta do jogo.

Atualizar nunca mexe nos seus dados, porque eles ficam fora da pasta do código.

## Sem instalar: modo demonstração

Abra o arquivo `web/index.html` direto no navegador (dois cliques). Entra um jogador de exemplo, com histórico, e nada é
gravado: recarregar a página volta ao começo.

## Problemas comuns

- **"python3 não é reconhecido" / "py não é reconhecido" (Windows):** o Python foi instalado sem marcar "Add to PATH".
  Rode o instalador de novo, escolha **Modify** e marque a opção.
- **"A porta 8642 está ocupada":** outro programa usa essa porta. Rode com outra: `python3 servidor.py --porta 8643`.
- **O navegador não abriu:** abra http://127.0.0.1:8642/ à mão.
- **Codeforces não conta:** confira o handle na aba Regras. A contagem atualiza a cada 10 minutos e precisa de internet.

## Como funciona por dentro

- `servidor.py`: servidor local (só a biblioteca padrão do Python). Lê e grava os seus arquivos, cria os hábitos de cada dia
  e consulta o Codeforces. Só aceita conexões do próprio computador.
- `web/index.html`: a página do jogo. `web/motor.js`: todas as regras e contas. `web/guia.js`: assistente e tutorial.
  `web/demo.js`: o servidor de mentira do modo demonstração.
- **IA opcional.** O jogo funciona sem IA. Uma versão futura trará prompts prontos para quem quiser usar uma (plano de
  ensino da disciplina, cartas narradas).

## Licença

[MIT](LICENSE): pode usar, modificar e distribuir, mantendo o aviso de copyright.
