import { buildComment } from '../src/commenter';
import { ValidationResult } from '../src/types';

describe('commenter', () => {
  const mockResult: ValidationResult = {
    check: {
      passed: true,
      errors: [],
      files: {
        requirements: { path: 'R.md', content: '# R', exists: true, size: 120 },
        design: { path: 'D.md', content: '# D', exists: true, size: 150 },
        tasks: { path: 'T.md', content: '# T', exists: true, size: 200 }
      }
    },
    tasks: {
      total: 10,
      completed: 8,
      pending: 1,
      inProgress: 1
    },
    analysis: {
      score: 85,
      issues: ['Issue 1'],
      suggestions: ['Sug 1'],
      summary: 'Spec is good.'
    },
    overallScore: 85,
    passed: true
  };

  test('debe construir el Markdown correctamente con análisis IA', () => {
    const markdown = buildComment(mockResult);
    
    expect(markdown).toContain('## 🔍 Spec Validator');
    expect(markdown).toContain('**Score de coherencia: 85/100** ✅');
    expect(markdown).toContain('### Verificación básica');
    expect(markdown).toContain('✅ REQUIREMENTS.md encontrado (120 chars)');
    expect(markdown).toContain('### Tareas');
    expect(markdown).toContain('✅ 8 completadas / 2 pendientes');
    expect(markdown).toContain('🚧 1 en progreso');
    expect(markdown).toContain('### Análisis IA');
    expect(markdown).toContain('Spec is good.');
    expect(markdown).toContain('⚠️ Issue 1');
    expect(markdown).toContain('💡 Sug 1');
    expect(markdown).toContain('<!-- spec-validator-comment -->');
  });

  test('debe manejar el caso de análisis IA omitido', () => {
    const resultNoIA = {
      ...mockResult,
      analysis: {
        score: -1,
        issues: [],
        suggestions: [],
        summary: '',
        skipped: true
      }
    };
    const markdown = buildComment(resultNoIA);
    expect(markdown).toContain('Análisis IA omitido');
  });

  test('debe mostrar errores de verificación básica', () => {
    const resultWithError = {
      ...mockResult,
      passed: false,
      overallScore: 0,
      check: {
        ...mockResult.check,
        passed: false,
        errors: [{
          file: 'DESIGN.md',
          message: 'Archivo DESIGN.md no encontrado',
          type: 'missing' as const
        }]
      }
    };
    const markdown = buildComment(resultWithError);
    expect(markdown).toContain('❌ DESIGN.md Archivo DESIGN.md no encontrado');
    expect(markdown).toContain('**Score de coherencia: 0/100** ❌');
  });
});
