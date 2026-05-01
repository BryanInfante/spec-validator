import { analyzeCoherence } from '../src/analyzer';
import { SpecFiles } from '../src/types';

// Mock de fetch global
global.fetch = jest.fn();

const mockFiles: SpecFiles = {
  requirements: { path: 'R.md', content: 'reqs', exists: true, size: 4 },
  design: { path: 'D.md', content: 'design', exists: true, size: 6 },
  tasks: { path: 'T.md', content: 'tasks', exists: true, size: 5 }
};

describe('analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe retornar skipped si no hay API key', async () => {
    const result = await analyzeCoherence(mockFiles, '');
    expect(result.skipped).toBe(true);
    expect(result.score).toBe(-1);
  });

  test('debe retornar resultado exitoso si la API responde correctamente', async () => {
    const mockApiResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            score: 90,
            issues: [],
            suggestions: ['Good job'],
            summary: 'Perfect spec'
          })
        }
      }]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await analyzeCoherence(mockFiles, 'fake-key');
    expect(result.score).toBe(90);
    expect(result.skipped).toBeFalsy();
    expect(result.summary).toBe('Perfect spec');
  });

  test('debe manejar error de parseo JSON', async () => {
    const mockApiResponse = {
      choices: [{
        message: {
          content: 'No soy un JSON'
        }
      }]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await analyzeCoherence(mockFiles, 'fake-key');
    expect(result.score).toBe(50);
    expect(result.issues).toContain('Error de parseo en la respuesta de la IA');
  });

  test('debe manejar error de red o API no ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error')
    });

    const result = await analyzeCoherence(mockFiles, 'fake-key');
    expect(result.score).toBe(-1);
    expect(result.skipped).toBe(true);
    expect(result.issues[0]).toContain('Error técnico');
  });
});
