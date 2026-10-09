# Pendências e ideias (template)

Lista viva do que falta e do que foi pensado para as próximas versões. O desenho do modo em grupo (placar Torre Trick)
tem as pendências dele em [`COLETIVO.md`](COLETIVO.md).

## Ideias para as próximas versões (anotadas em 09/10/2026; a v0.3 saiu no mesmo dia)

1. **Textos pessoais viram escolha do jogador, sem ficar genéricos.** Muitos textos ainda são do jogo pessoal do autor
   (Killua, "transmutação estilo Killua", nomes e falas de personagens). Ideia: o jogador escolhe o personagem favorito
   no começo (assistente) ou compra na loja, e os textos se adaptam a ele. Falta decidir o formato: lista fixa de
   personagens com textos prontos, textos escritos pelo jogador ou textos gerados por IA.
2. **Personagem conselheiro na aba Chefões, só para quem usa IA.** Um personagem de anime que lê as disciplinas, as
   tarefas de cada uma e o plano de ensino e dá dicas soltas. O personagem é escolhido (ou comprado) na loja. Falta
   decidir como a IA entra: copia e cola, como no resto do `IA.md`, ou uma chave de API do jogador.
3. **Hábito semanal acima da meta rende mais.** Ex.: academia com meta de 2× por semana feita 3× ganha bônus. Hoje o
   hábito some da Lista quando a meta é cumprida; seria preciso deixar marcar a mais (botão "fiz de novo") e definir o
   bônus.
4. **Tradução para mais de um idioma.** Textos da página, do assistente, do servidor e dos pedidos para a IA. A opção de
   formato de data (dd/mm ou mm/dd) já existe e serviria de base.
5. **Conquistas criadas pela IA, além das fixas.** As 000–099 já são genéricas (gerais + quatro por disciplina, 060 em
   diante). A IA poderia propor conquistas mais específicas, desde que num formato que o motor confere sozinho (ex.:
   "10 tarefas com a palavra sql", "hábito leitura em 14 dias"): a IA inventa o desafio e o nome, o jogo verifica.
6. **Duolingo, como o Codeforces (ideia de um amigo).** Para quem usa: ligar a conta e o jogo conta os dias de
   Duolingo sozinho (hábito automático, heatmap e conquistas), opcional como o handle do Codeforces. As dificuldades
   (o Duolingo não tem API pública oficial; ver o que dá para ler e se é estável) ficam para avaliar depois.
7. **Ideias guardadas, fora do template para não complicar** (avaliar se interessam aos amigos):
   - gravar o áudio da aula e transcrever no computador, gerando resumo e tarefas (o jogo do autor faz);
   - conferir datas de prova na agenda do Google.

## Técnico

- **Testar no Windows e no Mac:** `instalar.ps1`, início automático (`.vbs` na pasta Inicializar, LaunchAgent no Mac),
  `pythonw` sem janela, boas-vindas no terminal. Precisa de um amigo em cada sistema.
- **GitHub Pages:** no ar em https://caioparanaiba.github.io/todo-engine/ (atualiza a cada push que mexe em `web/`).
- **Fotos de perfil:** as imagens de personagens não vão para o repositório (direitos). Decidir de onde vêm (avatares
  próprios ou livres, ou cada um coloca os seus em `~/.hunter-todo/avatares/`).
- **Testes automáticos** do `servidor.py` (hoje os testes são scripts soltos e o Firefox controlado por script).
- **Calendário do Semestre:** os meses da aba Semestre estão fixos (ago/2026 a fev/2027); devem sair da temporada.
- **Prioridade na Lista:**
  - a seta de prioridade só sobe: falta a de descer (o servidor já tem a ação `down`);
  - escolher a prioridade (A, B, C ou nenhuma) já no formulário de adicionar (hoje só digitando `(A)` no começo);
  - **prioridade recomendada antes de enviar:** o formulário sugere uma prioridade pela disciplina (prova chegando, chefão
    em fúria ou com mais tarefas atrasadas), pelo prazo e por algum outro fator a definir. O jogador aceita a sugestão e
    envia, ou escolhe outra, ou nenhuma.
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
