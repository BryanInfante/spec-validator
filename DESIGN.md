# DESIGN.md
# spec-validator — GitHub Action para Spec-Driven Development

## 1. Arquitectura general

```
spec-validator/
├── action.yml              # Definición de la GitHub Action
├── src/
│   ├── main.ts             # Entrypoint principal
│   ├── checker.ts          # Verificación básica de archivos
│   ├── analyzer.ts         # Análisis IA con Groq
│   ├── commenter.ts        # Comentarios en PR via GitHub API
│   ├── parser.ts           # Parser de TASKS.md (checkboxes)
│   └── types.ts            # Interfaces TypeScript
├── dist/
│   └── index.js            # Bundle compilado (ncc)
├── tests/
│   ├── checker.test.ts
│   ├── analyzer.test.ts
│   └── parser.test.ts
├── package.json
├── tsconfig.json
├── AGENTS.md
├── REQUIREMENTS.md
├── DESIGN.md
└── TASKS.md
```

---

## 2. Decisiones de arquitectura

### ADR-01: TypeScript sobre Python
**Decisión:** Usar TypeScript con @actions/core y @actions/github.  
**Razón:** Es el estándar oficial de GitHub Actions. Las librerías @actions/* 
están diseñadas para TS/JS. Mejor integración con la API de GitHub.  
**Consecuencia:** Bundle con ncc para generar un solo index.js sin node_modules.

### ADR-02: ncc para compilar
**Decisión:** Usar @vercel/ncc para compilar todo en un solo dist/index.js.  
**Razón:** GitHub Actions requiere que el código esté listo para ejecutar 
sin instalar dependencias. ncc empaqueta todo en un archivo.  
**Consecuencia:** dist/index.js debe commitearse al repo.

### ADR-03: Groq como provider IA
**Decisión:** Usar Groq API con modelo llama-3.3-70b-versatile.  
**Razón:** Gratis, rápido, compatible con OpenAI. Mismo provider que spec-gen.  
**Consecuencia:** Si el usuario no tiene GROQ_API_KEY, el análisis IA se omite 
y solo corre la verificación básica.

### ADR-04: Actualizar comentario existente vs crear nuevo
**Decisión:** Buscar comentario previo del bot y actualizarlo.  
**Razón:** Evita spam de comentarios en PRs con múltiples commits.  
**Consecuencia:** La Action necesita permiso de escritura en issues/PRs.

---

## 3. Flujo de ejecución

```
PR abierto / actualizado
        │
        ▼
main.ts → getInputs()
        │
        ▼
checker.ts → checkFiles()
   ├── ¿Existen REQUIREMENTS.md, DESIGN.md, TASKS.md?
   ├── ¿Tienen contenido mínimo (>100 chars)?
   └── ¿Tienen headers Markdown válidos?
        │
        ├── FALLA → commenter.ts → postComment(FAILED) → core.setFailed()
        │
        ▼ OK
parser.ts → parseTasksMd()
   └── Cuenta [ ] y [x] → taskStats
        │
        ▼
analyzer.ts → analyzeCoherence()
   ├── ¿GROQ_API_KEY configurada?
   │   ├── NO → skip (warning en logs)
   │   └── SÍ → POST /chat/completions
   │             → { score, issues, suggestions }
        │
        ▼
commenter.ts → postOrUpdateComment()
   ├── Busca comentario previo del bot
   ├── Si existe → PATCH (actualizar)
   └── Si no → POST (crear nuevo)
        │
        ▼
score >= min-score → core.setOutput("passed", "true")
score < min-score  → core.setFailed("Spec coherence too low")
```

---

## 4. action.yml — Definición de la Action

```yaml
name: 'Spec Validator'
description: 'Verifica coherencia de specs SDD en PRs'
author: 'BryanInfante'

inputs:
  groq-api-key:
    description: 'API key de Groq para análisis IA'
    required: false
  min-score:
    description: 'Score mínimo de coherencia (0-100)'
    required: false
    default: '70'
  fail-on-warning:
    description: 'Fallar si hay warnings además de errores'
    required: false
    default: 'false'
  files-path:
    description: 'Ruta donde buscar los archivos de spec'
    required: false
    default: '.'

outputs:
  score:
    description: 'Score de coherencia (0-100)'
  passed:
    description: 'true si pasó la validación'
  issues-count:
    description: 'Número de problemas detectados'

runs:
  using: 'node20'
  main: 'dist/index.js'
```

---

## 5. Prompt de análisis IA

```
Eres un experto en Spec-Driven Development. Analiza estos 3 archivos 
de especificación y determina su coherencia.

REQUIREMENTS.md:
{{requirements}}

DESIGN.md:
{{design}}

TASKS.md:
{{tasks}}

Responde SOLO en JSON:
{
  "score": 0-100,
  "issues": ["problema 1", "problema 2"],
  "suggestions": ["sugerencia 1"],
  "summary": "resumen en una oración"
}

Criterios de evaluación:
- ¿Las entidades en DESIGN coinciden con los requisitos?
- ¿Las tareas en TASKS cubren todos los casos de uso?
- ¿Hay contradicciones entre los 3 documentos?
- ¿El diseño es suficiente para implementar los requisitos?
```

---

## 6. Formato del comentario en PR

```markdown
## 🔍 Spec Validator

**Score de coherencia: 85/100** ✅

### Verificación básica
- ✅ REQUIREMENTS.md encontrado (2,340 chars)
- ✅ DESIGN.md encontrado (1,876 chars)  
- ✅ TASKS.md encontrado (3,102 chars)

### Tareas
- ✅ 18 completadas / 4 pendientes

### Análisis IA
> Las especificaciones son coherentes. El diseño cubre todos 
> los casos de uso definidos en requirements.

### Issues detectados
- ⚠️ UC-03 no tiene tarea correspondiente en TASKS.md

---
*Generado por [spec-validator](https://github.com/BryanInfante/spec-validator)*
```

---

## 7. Dependencias

```json
{
  "dependencies": {
    "@actions/core": "^1.10.0",
    "@actions/github": "^6.0.0"
  },
  "devDependencies": {
    "@vercel/ncc": "^0.38.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```
