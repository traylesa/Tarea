# Justfile Delegador - PruebaInicializa4
# Delega todos los comandos a fabrica/justfile
#
# Uso: just [comando] [argumentos]
# Ejemplo: just ayuda
#          just desplegar backend
#          just paralelo "hu-2-15-1"

set shell := ["powershell.exe", "-c"]

# Mostrar ayuda por defecto
[private]
default:
    @just --justfile fabrica/justfile --list

# Comandos principales
ayuda:
    @just --justfile fabrica/justfile ayuda

iniciar:
    @just --justfile fabrica/justfile iniciar

desplegar *ARGS:
    @just --justfile fabrica/justfile desplegar {{ARGS}}

probar *ARGS:
    @just --justfile fabrica/justfile probar {{ARGS}}

paralelo *ARGS:
    @just --justfile fabrica/justfile paralelo {{ARGS}}

paralelo-limpiar *ARGS:
    @just --justfile fabrica/justfile paralelo-limpiar {{ARGS}}

paralelos-activos:
    @just --justfile fabrica/justfile paralelos-activos

habilidades *ARGS:
    @just --justfile fabrica/justfile habilidades {{ARGS}}

habilidades-reindexar:
    @just --justfile fabrica/justfile habilidades-reindexar

automatizar:
    @just --justfile fabrica/justfile automatizar

automatizar-batch:
    @just --justfile fabrica/justfile automatizar-batch

iniciar-fabrica:
    @just --justfile fabrica/justfile iniciar-fabrica

concluir *ARGS:
    @just --justfile fabrica/justfile concluir {{ARGS}}

ejecutar-buzon *ARGS:
    @just --justfile fabrica/justfile ejecutar-buzon {{ARGS}}

estado-buzones:
    @just --justfile fabrica/justfile estado-buzones

limpiar *ARGS:
    @just --justfile fabrica/justfile limpiar {{ARGS}}

diagnostico *ARGS:
    @just --justfile fabrica/justfile diagnostico {{ARGS}}
