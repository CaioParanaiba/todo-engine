# Hunter.todo

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda localmente, sem dependências além do Python 3, no Linux, Windows e Mac.

> **Em construção.** Esta é a versão para outros jogadores, derivada do jogo pessoal do autor.
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md).

## Como vai funcionar

- **Código e dados separados.** O repositório tem só código. Seus dados (`todo.txt`, `done.txt`, notas, loja,
  configuração) ficam em `~/.hunter-todo/`, e `git pull` para atualizar nunca mexe neles.
- **Tudo na página do jogo:** adicionar, concluir, editar e remover tarefas, ver quanto cada uma vale de XP,
  chefões, Book de cartas e loja.
- **IA opcional.** O jogo funciona sem IA; `IA.md` trará prompts prontos para quem quiser usar uma
  (plano de ensino da disciplina, cartas narradas).
