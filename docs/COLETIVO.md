# Hunter.todo coletivo: desenho (v3, 08/10/2026)

Versão em grupo do Hunter.todo, ideia do Caio e de um amigo. **Ainda não implementado.** Foco atual: deixar o placar
**público e balanceado**. `⏳` = pendente; toda pontuação está **a calibrar** com 2–3 semanas de dados reais
(os números que aparecem aqui só ilustram as contas).

## Princípios

- **Não se compara XP de tarefa entre pessoas.** As tarefas são subjetivas: quem fatia tarefas ou escreve mais tarefas
  numa matéria ganha mais. Nem uma IA ponderando resolve (ela vê o texto, não o esforço). O público compara só
  sinais difíceis de inflar: XP **com teto**, hábitos, **superação contra si mesmo** e **evolução** de nota.
- **Duas camadas.** A individual fica como é (subjetiva, só a pessoa joga contra si). A coletiva recebe só um resumo.
- **Tarefas e XP bruto nunca saem da máquina do jogador.**
- **Combinado entre amigos, não anti-fraude.** Dá para marcar ✓ numa tarefa boba para manter o dia; isso é aceito.
- Nada pune (como no individual): nota abaixo da referência dá 0, não negativo.

## Nomes

| O quê | Nome |
|---|---|
| Torre individual (já existe) | **Arena Celestial**: você **sobe** andares com o seu XP |
| Placar público | **Torre Trick**: você **desce** (no Exame Hunter os candidatos descem a Torre Trick, cada um por um caminho). Unidade: andar descido |
| Moeda pública | **Trick Coin** |
| Servidor central | **Associação Hunter** |
| Evento de fim de temporada | **Exame Hunter** (desenvolver depois) |

Tema: **HxH para todos** nesta temporada.

## Arquitetura

- Cada jogador roda o **template individual**: só o jogo (sem o painel do Caio, sem aulas/transcrição),
  com `jogador.conf` (nome, disciplinas, **mapa de tags** → categorias do motor, handle do CF, exposição de notas).
- **Associação Hunter** num **PC dedicado 24/7**, acesso por **VPN** (Tailscale; Headscale se quiserem tudo self-hosted).
  Direto no servidor, sem passar pelo GitHub (o GitHub serve só para distribuir o código do template).
- O jogo local manda um **resumo por POST** e guarda numa fila quando estiver offline. O jogo nunca depende do servidor para funcionar.
- A Associação calcula a Torre Trick e serve a página do placar, o catálogo da loja pública e as imagens.

## Pontos da Torre Trick

### A. XP do dia com teto
- Por dia conta `min(XP do dia, teto)`. Ex.: com teto 75: 100 → 75, 50 → 50, 300 → 75.
- **Teto = mediana do XP diário de todos os jogadores no mês anterior, contando todos os dias** (inclusive os dias com 0).
- 1º mês (sem histórico): teto provisório ⏳.

### B. Hábitos coletivos
- **Codeforces:** verificado pela API do CF. O placar mostra o **heatmap do Codeforces** de cada jogador.
- **Typing e outros:** a pessoa marca no jogo individual (recorrente com tag de hábito). O público recebe só
  **fez / não fez** por dia.
- ⏳ lista final dos hábitos · ⏳ pontos por hábito.

### C. Missão da semana
- Cumprir a missão (3 dias no atributo mais fraco) dá pontos ⏳.

### D. Superação
- `base` = o maior valor entre a média dos períodos anteriores e a média da temporada.
- `r` = (período atual) ÷ base.
- `bônus = S × min(r − 1, 0,5) ÷ 0,5`, e 0 se `r ≤ 1`.
- **S = o prêmio máximo.** Cada 1% acima da própria média vale 2% do S, e +50% leva o S inteiro.
  "Contínuo" quer dizer sem degraus, não quer dizer pouco.
  Ex. com S = 1000: +10% → 200 · +25% → 500 · +50% ou mais → 1000.
- O S **não precisa ser enorme**. O XP com teto continua sendo o principal. ⏳ valor.
- Dimensões (cada uma com o próprio S ⏳):

| Dimensão | Período | Base |
|---|---|---|
| XP (sem teto, contra si mesmo) | **mês**: projeção visível durante o mês e bônus creditado no dia 1º como "descida especial" | últimos 3 meses / temporada |
| Codeforces (problemas distintos) | **semana**, para ver o resultado logo | últimas 4 semanas / temporada |
| Hábitos (dias cumpridos) | mês ⏳ | últimos 3 meses / temporada |

- Primeiro período do jogador: sem bônus (ele vira a base).
- ⏳ Risco: inflar o XP de um mês para pegar o bônus. As proteções já previstas são a base pela média da temporada e o r limitado a 1,5. Se não bastar, a dimensão XP passa a usar o XP com teto.

### E. Notas, pela evolução (nunca pela nota em si)
- `pontos = k × max(0, nota − referência)`. Referência = CR do semestre anterior, ou a média das avaliações já feitas na temporada.
- Exposição no `jogador.conf`: `notas = publico` (mostra nota e ganha pontos) · `evolucao` (só os pontos) · `privado` (sem pontos de nota).
- ⏳ k · ⏳ referência de quem está no 1º semestre.

### F. Cooperativo
- **Chefão do grupo mensal:** vida = meta somada do grupo. Se o grupo derrubar, todos ganham a mesma recompensa.
- **Ten do grupo:** dias seguidos com todos ativos, com 1 Zetsu coletivo por semana.
- ⏳ metas e recompensas.

## Lojas

| | **Masadora (individual)** | **Loja da Associação (pública)** |
|---|---|---|
| Moeda | **Jenny**, do XP pessoal | **Trick Coin**, ganha **só pela Torre Trick** |
| Vende | o que só o jogador vê: paletas, texturas, efeitos, mundo pixel, prêmios reais (cofre) | o que os outros veem: **foto de perfil**, moldura, título, emblema no placar |
| Onde | máquina do jogador | catálogo e imagens no servidor |

- Duas moedas porque o XP pessoal é subjetivo: o visual público só pode vir de pontos balanceados.
- **Avatares vão para a loja pública.** O jogo local usa o avatar comprado lá.
- Avatares novos são decididos **antes de cada temporada**. Nesta primeira, o **host (Caio)** adiciona durante a temporada.
- **IDs de item independentes do tema** (`av.killua`, `pal.simples`). Tema e temporada são atributos, para as compras continuarem valendo quando o tema mudar, como no Fortnite.
- **Itens únicos:** só 1 no grupo, com o dono registrado no servidor. ⏳ como se conquistam.

## IA

- **Do jogador:** opcional e a cargo dele. O template traz o `IA.md` com prompts prontos (plano de ensino uma vez por semestre,
  cartas narradas). Sem IA, o plano de ensino se cadastra pelo formulário da aba Chefões.
- **Do servidor (host):** uma IA na Associação para narrar o **cenário público geral** (crônicas da temporada, da semana do grupo)
  e outras decisões ⏳.

## Template individual (próxima etapa)

- Baseado no jogo do Caio, **sem o painel**: a página do jogo vira a tela principal, com **adicionar, concluir, remover e editar
  tarefas** e **ver quanto cada tarefa vale de XP**.
- **Código separado dos dados:** atualizar o template (git pull) nunca mexe em `todo.txt`, `done.txt`, notas, estado e configurações.
- Distribuído pelo GitHub para os outros jogadores testarem. O design da aba do jogador provavelmente muda.

## Baú de ideias (futuro)

- Temas por temporada (Naruto, Pokémon...), com as compras continuando a valer.
- **Trocas, compra e venda de itens entre jogadores.**
- Problemas do CF sugeridos ao grupo (dificuldades variadas em torno da média), com bônus para quem resolver primeiro. Precisa do handle de cada um para filtrar o que a pessoa já resolveu.
- **Batalha 1×1 com problemas do Codeforces.**
- Exame Hunter (fim de temporada): campeão e cartas como "maior superação" e "maior Ten".

## Pendências (⏳)

1. Teto do 1º mês
2. Lista de hábitos coletivos · pontos por hábito
3. Pontos da missão
4. S de cada dimensão da superação · XP com ou sem teto na superação · período dos hábitos
5. k das notas · referência do 1º semestre
6. Metas e recompensas do chefão do grupo
7. Itens únicos
8. O que mais a IA do servidor decide
9. Todas as pontuações: calibrar com dados reais
