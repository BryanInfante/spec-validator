import { TaskStats } from './types';

/**
 * Parsea el contenido de TASKS.md para extraer estadísticas de tareas.
 * Busca patrones del tipo:
 * - [ ] -> Pendiente
 * - [x] -> Completado (case insensitive)
 * - [X] -> Completado
 * - [~] -> En progreso
 */
export function parseTasksMd(content: string): TaskStats {
  const stats: TaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
  };

  // Regex para encontrar checkboxes: - [ ] o - [x] o - [~]
  // Permite espacios antes del guion y después del checkbox.
  const checkboxRegex = /^\s*-\s*\[([\s xX~])\].*$/gm;
  
  let match;
  while ((match = checkboxRegex.exec(content)) !== null) {
    const status = match[1].toLowerCase();
    
    stats.total++;
    
    if (status === 'x') {
      stats.completed++;
    } else if (status === '~') {
      stats.inProgress++;
    } else if (status === ' ' || status === '') {
      stats.pending++;
    }
  }

  return stats;
}
