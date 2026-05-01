import { parseTasksMd } from '../src/parser';

describe('parser', () => {
  test('debe contar correctamente una mezcla de estados', () => {
    const content = `
# Tasks
- [x] Tarea 1
- [ ] Tarea 2
- [~] Tarea 3
- [X] Tarea 4 (Mayúscula)
- [ ] Tarea 5
    `;
    const stats = parseTasksMd(content);
    expect(stats.total).toBe(5);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.inProgress).toBe(1);
  });

  test('debe retornar ceros si no hay checkboxes', () => {
    const content = `
# Sin tareas
Solo texto plano sin formato de lista de tareas.
    `;
    const stats = parseTasksMd(content);
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.inProgress).toBe(0);
  });

  test('debe manejar indentación y espacios', () => {
    const content = `
  - [x] Identada
- [ ] Sin espacio tras guion (inválido por regex actual pero común)
-  [~] Con espacio tras guion
    `;
    // Nota: La regex actual /^\s*-\s*\[([\s xX~])\].*$/gm requiere un espacio después de '-' si no está pegado
    const stats = parseTasksMd(content);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.inProgress).toBe(1);
  });

  test('debe ignorar checkboxes que no están al inicio de la línea (con guion)', () => {
    const content = `
Texto antes - [x] No debe contar
* [ ] Con asterisco no debe contar (solo soportamos guiones por ahora)
    `;
    const stats = parseTasksMd(content);
    expect(stats.total).toBe(0);
  });
});
