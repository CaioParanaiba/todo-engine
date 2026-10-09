#!/bin/sh
# Hunter.todo: baixa (ou atualiza) e abre o jogo com um comando só, no Linux e no Mac.
#   curl -fsSL https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.sh | sh
# Outra pasta:  curl -fsSL .../instalar.sh | HUNTER_PASTA=~/jogos/todo sh
# Na primeira vez, o servidor.py mostra as boas-vindas e pergunta se o jogo inicia com o computador.
set -e
REPO="https://github.com/CaioParanaiba/todo-engine"
PASTA="${HUNTER_PASTA:-$HOME/todo-engine}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "O Hunter.todo precisa do Python 3. Instale pelo gerenciador de pacotes (ou em https://www.python.org/downloads/) e rode de novo."
  exit 1
fi

if [ -d "$PASTA/.git" ]; then
  echo "Atualizando o jogo em $PASTA"
  git -C "$PASTA" pull --ff-only
elif [ -f "$PASTA/servidor.py" ]; then
  echo "Atualizando o jogo em $PASTA (sem git: baixando a versão nova por cima; seus dados ficam em outra pasta)"
  curl -fsSL "$REPO/archive/refs/heads/main.tar.gz" | tar -xz -C "$PASTA" --strip-components=1
elif [ -e "$PASTA" ]; then
  echo "A pasta $PASTA já existe e não é o jogo. Escolha outra: curl -fsSL .../instalar.sh | HUNTER_PASTA=~/outra-pasta sh"
  exit 1
elif command -v git >/dev/null 2>&1; then
  echo "Baixando o jogo em $PASTA"
  git clone "$REPO.git" "$PASTA"
else
  echo "Baixando o jogo em $PASTA (sem git: para atualizar depois, rode este mesmo comando)"
  mkdir -p "$PASTA"
  curl -fsSL "$REPO/archive/refs/heads/main.tar.gz" | tar -xz -C "$PASTA" --strip-components=1
fi

cd "$PASTA"
# o script chega pelo cano (curl | sh): as perguntas das boas-vindas leem do terminal
if (: </dev/tty) 2>/dev/null; then   # abre de verdade (sem terminal, /dev/tty existe mas não abre)
  exec python3 servidor.py </dev/tty
else
  exec python3 servidor.py
fi
