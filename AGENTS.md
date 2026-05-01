# AGENTS.md
# spec-validator — Contexto para agentes IA

## ¿Qué es este proyecto?
GitHub Action reutilizable escrita en TypeScript que verifica la coherencia
de archivos de especificación SDD (REQUIREMENTS.md, DESIGN.md, TASKS.md)
en Pull Requests. Bloquea el merge si la spec está incompleta o incoherente.

## Stack
- **Lenguaje:** TypeScript 5.4+
- **Runtime:** Node.js 20 (requerido por GitHub Actions)
- **Librerías core:** @actions/core, @actions/github
- **Bundle:** @vercel/ncc (compila todo en dist/index.js)
- **Tests:** Jest + ts-jest
- **Linter:** ESLint + @typescript-eslint

## Estructura de carpetas
```
src/
├── main.ts       # Entrypoint — orquesta todo
├── checker.ts    # Verificación básica de archivos
├── analyzer.ts   # Análisis IA con Groq
├── commenter.ts  # Comentarios en PR via GitHub API
├── parser.ts     # Parser de checkboxes en TASKS.md
└── types.ts      # Interfaces TypeScript
dist/
└── index.js      # Bundle compilado — DEBE commitearse
```

## Reglas críticas de GitHub Actions
1. El archivo `dist/index.js` DEBE commitearse — GitHub lo ejecuta directamente
2. `action.yml` debe apuntar a `dist/index.js`, NO a `src/main.ts`
3. Nunca usar `require()` dinámico — ncc no lo soporta bien
4. Los secrets se leen con `core.getInput()`, nunca con `process.env` directamente
5. Usar `core.setFailed()` para errores, nunca `process.exit(1)`

## Convenciones de código
- **Naming:** camelCase funciones, PascalCase interfaces/types
- **Async:** async/await, nunca callbacks
- **Errores:** try/catch en todas las llamadas externas
- **Logs:** core.info() para info, core.warning() para warnings, core.error() para errores
- **No console.log** — usar siempre @actions/core

## Convenciones de commits
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `build:` cambios en dist/ o config de build
- `test:` tests
- `docs:` documentación

## Reglas de desarrollo
1. Leer TASKS.md antes de implementar. Marcar [~] al empezar, [x] al terminar.
2. types.ts debe implementarse ANTES que cualquier otro módulo.
3. Cada módulo tiene su test correspondiente — no commitear sin tests.
4. dist/index.js debe regenerarse con `npm run build` antes de cada commit.
5. No hardcodear el nombre del bot — leerlo del contexto de GitHub.

## Variables de entorno / Inputs
```
groq-api-key    # Input de la Action — API key de Groq (opcional)
min-score       # Input de la Action — score mínimo (default: 70)
fail-on-warning # Input de la Action — fallar en warnings (default: false)
files-path      # Input de la Action — ruta de specs (default: .)
GITHUB_TOKEN    # Automático — provisto por GitHub en cada workflow
```

## Cómo testear localmente
```bash
npm install
npm run build
# Para testear la Action localmente usar act:
# https://github.com/nektos/act
act pull_request -s GROQ_API_KEY=gsk_xxx
```

## Contexto de decisiones
- **TypeScript sobre Python:** estándar oficial de GitHub Actions, ver ADR-01
- **ncc para bundle:** requerido por GitHub Actions, ver ADR-02
- **Groq como IA:** mismo provider que spec-gen, consistencia del ecosistema, ver ADR-03
- **Actualizar comentario:** evitar spam en PRs, ver ADR-04
