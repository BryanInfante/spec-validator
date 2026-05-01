# TASKS.md
# spec-validator — GitHub Action

## Leyenda
- [ ] Pendiente
- [~] En progreso
- [x] Completado

---

## FASE 1 — Setup del proyecto

- [x] **T-01** Crear estructura de carpetas según DESIGN.md
- [x] **T-02** Inicializar `package.json` con dependencias
  - `@actions/core`, `@actions/github`, `@vercel/ncc`, `typescript`
- [x] **T-03** Configurar `tsconfig.json`
  - target: ES2020, module: commonjs, strict: true
- [x] **T-04** Crear `AGENTS.md` con contexto del proyecto
- [x] **T-05** Git init + `.gitignore`
  - Ignorar: `node_modules/` pero NO `dist/` (requerido por GitHub Actions)
- [x] **T-06** Crear `action.yml` con inputs y outputs definidos en DESIGN.md

---

## FASE 2 — Types e interfaces

- [x] **T-07** Implementar `src/types.ts`
  - `SpecFiles` — rutas y contenido de los 3 archivos
  - `CheckResult` — resultado de verificación básica
  - `AnalysisResult` — resultado del análisis IA (score, issues, suggestions)
  - `TaskStats` — tareas completadas vs pendientes
  - `ValidationResult` — resultado final combinado

---

## FASE 3 — Verificación básica

- [x] **T-08** Implementar `src/checker.ts`
  - `checkFiles(path: string): CheckResult`
  - Verifica existencia de REQUIREMENTS.md, DESIGN.md, TASKS.md
  - Verifica contenido mínimo (> 100 chars)
  - Verifica headers Markdown (al menos un `#`)
  - Retorna lista de errores con mensaje claro por cada fallo
- [x] **T-09** Test: `tests/checker.test.ts`
  - Test con carpeta que tiene los 3 archivos válidos
  - Test con carpeta sin DESIGN.md
  - Test con archivo vacío
  - Test con archivo sin headers Markdown

---

## FASE 4 — Parser de TASKS.md

- [x] **T-10** Implementar `src/parser.ts`
  - `parseTasksMd(content: string): TaskStats`
  - Regex para detectar `- [ ]` y `- [x]` (case insensitive)
  - También detecta `- [~]` como "en progreso"
  - Retorna: `{ total, completed, pending, inProgress }`
- [x] **T-11** Test: `tests/parser.test.ts`
  - Test con TASKS.md real del proyecto spec-gen
  - Test con archivo sin checkboxes
  - Test con mezcla de estados

---

## FASE 5 — Análisis IA

- [x] **T-12** Implementar `src/analyzer.ts`
  - `analyzeCoherence(files: SpecFiles, apiKey: string): AnalysisResult`
  - POST a `https://api.groq.com/openai/v1/chat/completions`
  - Modelo: `llama-3.3-70b-versatile`
  - Prompt del DESIGN.md, respuesta en JSON
  - Parse seguro del JSON (try/catch, fallback si falla)
  - Timeout de 30 segundos
- [x] **T-13** Manejo de errores en analyzer
  - Si no hay API key → retorna `{ score: -1, skipped: true }`
  - Si API falla → retorna warning, no error fatal
  - Si JSON inválido → retorna score 50 con issue "parse error"
- [x] **T-14** Test: `tests/analyzer.test.ts`
  - Test con mock de fetch (sin llamadas reales)
  - Test sin API key (debe retornar skipped)
  - Test con respuesta JSON inválida

---

## FASE 6 — Comentarios en PR

- [x] **T-15** Implementar `src/commenter.ts`
  - `postOrUpdateComment(result: ValidationResult): Promise<void>`
  - Usa `@actions/github` para acceder a la API de GitHub
  - Busca comentario previo del bot (by bot login)
  - Si existe → PATCH (actualizar), si no → POST (crear)
  - Genera Markdown del comentario según formato del DESIGN.md
- [x] **T-16** Función `buildComment(result: ValidationResult): string`
  - Badge ✅ / ❌ / ⚠️ según resultado
  - Sección verificación básica con cada archivo
  - Sección tareas (TaskStats)
  - Sección análisis IA (si corrió)
  - Footer con link al repo

---

## FASE 7 — Entrypoint principal

- [x] **T-17** Implementar `src/main.ts`
  - Leer inputs con `core.getInput()`
  - Ejecutar checker → si falla, comentar y `core.setFailed()`
  - Ejecutar parser → extraer taskStats
  - Ejecutar analyzer (si hay API key)
  - Ejecutar commenter
  - Setear outputs: `score`, `passed`, `issues-count`
  - `core.setFailed()` si score < min-score
- [x] **T-18** Manejo global de errores
  - try/catch en main con `core.setFailed(error.message)`
  - Logs en cada paso con `core.info()` y `core.warning()`

---

## FASE 8 — Build y distribución

- [x] **T-19** Configurar script de build en `package.json`
  - `"build": "ncc build src/main.ts -o dist"`
  - `"test": "jest"`
  - `"all": "npm run build && npm test"`
- [x] **T-20** Compilar y verificar `dist/index.js`
  - Que el bundle no supere 5MB
  - Que `action.yml` apunte correctamente a `dist/index.js`
- [x] **T-21** Crear workflow de CI propio
  - `.github/workflows/ci.yml`
  - Trigger: push a main y PRs
  - Jobs: build → test → verificar que dist está actualizado
- [ ] **T-22** Crear workflow de release
  - Trigger: tag `v*.*.*`
  - Build → test → commit dist → crear GitHub Release
- [x] **T-23** Crear README.md
  - Instrucciones de uso (el YAML del UC-05)
  - Qué verifica, qué outputs da
  - Badge de estado del CI

---

## FASE 9 — Publicación

- [x] **T-24** Agregar el validator al propio repo spec-gen como ejemplo
  - `.github/workflows/spec-validator.yml` en specgenerator-cli
  - Que la Action valide su propia spec en cada PR
- [ ] **T-25** Publicar en GitHub Marketplace
  - Verificar `action.yml` tiene `branding` (icon + color)
  - Marcar como "Public" en Marketplace

---

## Orden de implementación

```
T-01 → T-06          (setup)
T-07                 (types — base de todo)
T-08 → T-09          (checker — primer módulo funcional)
T-10 → T-11          (parser)
T-12 → T-14          (analyzer — el más complejo)
T-15 → T-16          (commenter)
T-17 → T-18          (main — integra todo)
T-19 → T-23          (build y CI)
T-24 → T-25          (publicación)
```

**Primera milestone:** T-01 a T-09 — checker funcionando en local.  
**Segunda milestone:** T-01 a T-18 — Action completa testeada localmente.  
**Tercera milestone:** T-24 — validando el propio spec-gen en GitHub.
