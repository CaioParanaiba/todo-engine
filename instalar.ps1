# Hunter.todo: baixa (ou atualiza) e abre o jogo com um comando só, no Windows (PowerShell).
#   irm https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.ps1 | iex
# Outra pasta: $env:HUNTER_PASTA = "C:\jogos\todo"; antes do comando acima.
# Na primeira vez, o servidor.py mostra as boas-vindas e pergunta se o jogo inicia com o computador.
$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/CaioParanaiba/todo-engine'
$pasta = if ($env:HUNTER_PASTA) { $env:HUNTER_PASTA } else { Join-Path $HOME 'todo-engine' }

$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) {
  Write-Host 'O Hunter.todo precisa do Python 3: https://www.python.org/downloads/ (no instalador, marque "Add python.exe to PATH"). Depois rode este comando de novo.'
  return
}

if (Test-Path (Join-Path $pasta '.git')) {
  Write-Host "Atualizando o jogo em $pasta"
  git -C $pasta pull --ff-only
} elseif (Test-Path $pasta) {
  Write-Host "A pasta $pasta já existe e não é o jogo. Escolha outra com `$env:HUNTER_PASTA."
  return
} elseif (Get-Command git -ErrorAction SilentlyContinue) {
  Write-Host "Baixando o jogo em $pasta"
  git clone "$repo.git" $pasta
} else {
  Write-Host "Baixando o jogo em $pasta (sem git: para atualizar depois, rode este mesmo comando)"
  $zip = Join-Path $env:TEMP 'todo-engine.zip'
  $tmp = Join-Path $env:TEMP 'todo-engine-zip'
  Invoke-WebRequest "$repo/archive/refs/heads/main.zip" -OutFile $zip
  Expand-Archive $zip $tmp -Force
  Move-Item (Join-Path $tmp 'todo-engine-main') $pasta
  Remove-Item $zip, $tmp -Recurse -Force
}

Set-Location $pasta
& $py.Source servidor.py
