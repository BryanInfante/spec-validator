# 🔍 Spec Validator

[![CI](https://github.com/BryanInfante/spec-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/BryanInfante/spec-validator/actions/workflows/ci.yml)

GitHub Action reutilizable para verificar la coherencia de archivos de especificación en proyectos que siguen la metodología **Spec-Driven Development (SDD)**.

## 🚀 ¿Qué hace?

Esta Action se ejecuta en Pull Requests y analiza tres archivos críticos:
- `REQUIREMENTS.md`
- `DESIGN.md`
- `TASKS.md`

### Verificaciones:
1.  **Básica:** Confirma la existencia de los archivos, contenido mínimo (>100 chars) y formato Markdown válido.
2.  **Tareas:** Parsea `TASKS.md` para extraer estadísticas de progreso (pendientes, en progreso, completadas).
3.  **IA (Groq):** Realiza un análisis cualitativo de coherencia entre los tres documentos usando Llama 3.3.

## 🛠️ Uso

Agrega un archivo `.github/workflows/spec-validator.yml` a tu repositorio:

```yaml
name: Spec Validation
on:
  pull_request:
    paths:
      - 'REQUIREMENTS.md'
      - 'DESIGN.md'
      - 'TASKS.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Specs
        uses: BryanInfante/spec-validator@v1
        with:
          groq-api-key: \${{ secrets.GROQ_API_KEY }}
          min-score: 75
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
```

## ⚙️ Inputs

| Input | Descripción | Default |
|-------|-------------|---------|
| `groq-api-key` | API Key de Groq para análisis IA | (Opcional) |
| `min-score` | Score mínimo de coherencia (0-100) | `70` |
| `files-path` | Ruta donde buscar los archivos | `.` |
| `GITHUB_TOKEN` | Token para comentar en el PR | `github.token` |

## 📊 Outputs

- `score`: Score de coherencia final (0-100).
- `passed`: "true" si pasó todas las validaciones.
- `issues-count`: Número de problemas detectados.

## 📝 Licencia

MIT
