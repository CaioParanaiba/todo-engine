# Pendências e ideias (template)

Lista viva do que falta e do que foi pensado para as próximas versões. O desenho do modo em grupo (placar Torre Trick)
tem as pendências dele em [`COLETIVO.md`](COLETIVO.md).

## Ideias para a v0.3 (anotadas em 09/10/2026)

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
5. **Tutorial do Book: cartas que se usam são feitiços.** Onde o tutorial fala em "usar carta", trocar por
   **feitiços** e explicar em poucas linhas o que são (de onde vêm, como se usam, quando expiram).
6. **Rever o que entra nas conquistas 000–099** do Book: quais conquistas fazem sentido para qualquer jogador (hoje
   várias vêm do jogo pessoal do autor).
7. **Tutorial da loja (Masadora) mais completo:** explicar o que cada aba faz (aparência, mundo pixel, prêmios reais,
   feitiços) e como a loja funciona (Jenny, compra por semana, equipar).
8. **Prêmios reais fáceis de personalizar.** Um jeito simples de o jogador cadastrar os próprios prêmios (nome e preço
   em Jenny), com uma referência de quanto custa cada faixa de preço em esforço: por exemplo, "até X J ≈ um dia
   produtivo", "até Y J ≈ uma semana boa". Assim ele sabe se o preço que escolheu é fácil ou difícil.
9. **Aba Torre Trick ("em breve") abrir uma explicação:** ao clicar, mostrar o que vem no modo em grupo (placar entre
   amigos, Trick Coin, chefão do grupo; ver [`COLETIVO.md`](COLETIVO.md)), em vez de não fazer nada.
10. **Ideias guardadas, fora do template para não complicar** (avaliar se interessam aos amigos):
   - gravar o áudio da aula e transcrever no computador, gerando resumo e tarefas (o jogo do autor faz);
   - conferir datas de prova na agenda do Google.

## Técnico

- **Testar no Windows e no Mac:** `instalar.ps1`, início automático (`.vbs` na pasta Inicializar, LaunchAgent no Mac),
  `pythonw` sem janela, boas-vindas no terminal. Precisa de um amigo em cada sistema.
- **Tag v0.2** depois do teste dos amigos (o código já diz `0.2-dev`).
- **GitHub Pages:** no ar em https://caioparanaiba.github.io/todo-engine/ (atualiza a cada push que mexe em `web/`).
- **Fotos de perfil:** as imagens de personagens não vão para o repositório (direitos). Decidir de onde vêm (avatares
  próprios ou livres, ou cada um coloca os seus em `~/.hunter-todo/avatares/`).
- **Backup:** botão "baixar meus dados" (ZIP da pasta de dados) na aba Regras.
- **Testes automáticos** do `servidor.py` (hoje os testes são scripts soltos e o Firefox controlado por script).
- **Caixa de entrada:** marcar um lembrete como aplicado pela página (hoje só editando `ajustes.txt`).
- **Calendário do Semestre:** os meses da aba Semestre estão fixos (ago/2026 a fev/2027); devem sair da temporada.
- **Prioridade na Lista:** o formulário de adicionar não tem seletor de prioridade (só digitando `(A)` no começo). Avaliar
  um botão A/B/C ao lado do prazo.

## Decisões em aberto

- **Nome definitivo do projeto** (o tema vai mudar, então não pode ser "hunter"). Junto com ele mudam: o repositório
  (`todo-engine`), a pasta de dados (`~/.hunter-todo/`, precisa de migração automática), o nome do serviço do início
  automático (`hunter-todo`) e a pasta do instalador (`~/todo-engine`).
