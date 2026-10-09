# Para IAs de terminal (Codex, Claude Code, Gemini CLI)

Se o jogador abriu você nesta pasta para usar o jogo, **leia o [`IA.md`](IA.md)**: ele tem tudo (dados, API, formatos,
o que pode e o que não pode). Não precisa ler o código.

- **Não crie automações.** Nada de rotina agendada, timer, cron, serviço, skill ou script próprio: a IA já se liga no
  próprio jogo, em **Regras → IA** (ver "Se o jogador pedir para configurar" no `IA.md`).
- **`docs/` não faz parte do jogo.** `docs/PENDENCIAS.md` e `docs/COLETIVO.md` são anotações do desenvolvimento do
  template; ignore-os ao ajudar o jogador.
- **Não mexa no código** (`servidor.py`, `web/`) nem guarde dados do jogador nesta pasta: os dados ficam em
  `~/.hunter-todo/`. Atualizar o jogo nunca mexe neles.

Se quem abriu você é quem desenvolve o template, o `README.md` explica como o código está organizado e o
`docs/PENDENCIAS.md` tem o que falta fazer.
