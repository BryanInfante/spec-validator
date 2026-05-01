# REQUIREMENTS.md
# spec-validator — GitHub Action para Spec-Driven Development

## 1. Descripción del producto

GitHub Action reutilizable que verifica automáticamente la coherencia
de los archivos de especificación SDD en cualquier repositorio.
Se ejecuta en cada PR y bloquea el merge si la spec está incompleta
o incoherente.

---

## 2. Usuarios objetivo

- Developers que practican SDD individualmente
- Equipos que quieren enforcer SDD en sus repositorios
- Proyectos open-source que usan spec-gen u otro método SDD

---

## 3. Casos de uso

### UC-01 — Verificación básica de archivos
**Trigger:** Pull Request abierto o actualizado  
**Flujo:**
1. GitHub Action se ejecuta automáticamente
2. Verifica que existen: `REQUIREMENTS.md`, `DESIGN.md`, `TASKS.md`
3. Verifica que cada archivo tiene estructura Markdown válida
4. Verifica que ningún archivo está vacío (mínimo 100 chars)

**Criterios de aceptación:**
- Si falta algún archivo → check falla con mensaje claro indicando cuál
- Si un archivo está vacío → check falla con sugerencia de usar spec-gen
- Si todo OK → check pasa y continúa al análisis IA

---

### UC-02 — Análisis de coherencia con IA
**Trigger:** UC-01 pasó exitosamente  
**Flujo:**
1. Action lee el contenido de los 3 archivos
2. Llama a Groq API con un prompt de validación
3. IA analiza coherencia entre los 3 documentos
4. Retorna: score de coherencia + lista de problemas detectados

**Criterios de aceptación:**
- Score >= 70% → check pasa con resumen en el PR comment
- Score < 70% → check falla con lista detallada de incoherencias
- Si Groq API falla → check pasa con warning (no bloquear por error de API)
- El análisis debe completarse en menos de 30 segundos

---

### UC-03 — Comentario automático en PR
**Trigger:** Análisis completado (UC-02)  
**Flujo:**
1. Action publica un comentario en el PR con:
   - Score de coherencia
   - Lista de problemas (si los hay)
   - Sugerencias de corrección
2. Si el PR ya tiene un comentario anterior del validator, lo actualiza

**Criterios de aceptación:**
- Comentario con formato Markdown claro
- Incluye badge visual: ✅ PASSED / ❌ FAILED / ⚠️ WARNING
- Nunca publica más de un comentario por PR (actualiza el existente)

---

### UC-04 — Verificar tareas pendientes
**Trigger:** UC-01 pasó exitosamente  
**Flujo:**
1. Action parsea TASKS.md buscando checkboxes
2. Cuenta tareas `[ ]` pendientes vs `[x]` completadas
3. Si hay tareas pendientes → warning (no falla, solo informa)

**Criterios de aceptación:**
- Reporta: X tareas completadas / Y tareas pendientes
- Incluye en el comentario del PR
- No bloquea el merge por tareas pendientes (solo warning)

---

### UC-05 — Configuración por repositorio
**Actor:** Developer que adopta el validator  
**Flujo:**
```yaml
# .github/workflows/spec-validator.yml
- uses: BryanInfante/spec-validator@v1
  with:
    groq-api-key: ${{ secrets.GROQ_API_KEY }}
    min-score: 70          # opcional, default 70
    fail-on-warning: false # opcional, default false
    files-path: '.'        # opcional, default raíz del repo
```

**Criterios de aceptación:**
- Funciona con configuración mínima (solo groq-api-key)
- Parámetros opcionales tienen defaults sensatos
- Error claro si groq-api-key no está configurada

---

## 4. Requisitos no funcionales

| ID | Requisito |
|----|-----------|
| RNF-01 | Tiempo total de ejecución < 45 segundos |
| RNF-02 | Publicado en GitHub Marketplace como Action reutilizable |
| RNF-03 | Compatible con repositorios en cualquier lenguaje |
| RNF-04 | No requiere instalar nada en el repo adoptante |
| RNF-05 | Funciona sin Groq API key (solo verificación básica) |
| RNF-06 | Logs claros en cada paso para debugging |

---

## 5. Fuera de alcance v1.0

- Soporte para otros nombres de archivos (solo REQUIREMENTS/DESIGN/TASKS)
- Integración con Jira o Linear
- Dashboard web de métricas de spec quality
- Soporte para specs en otros idiomas que no sean Markdown
