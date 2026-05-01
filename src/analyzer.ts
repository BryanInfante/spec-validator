import * as core from '@actions/core';
import { SpecFiles, AnalysisResult } from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function cleanContent(content: string): string {
  return content
    .replace(/\[([^\]]+)\]\(http[^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export async function analyzeCoherence(files: SpecFiles, apiKey: string): Promise<AnalysisResult> {
  if (!apiKey) {
    core.warning('No se proporcionó GROQ_API_KEY. Se omitirá el análisis IA.');
    return {
      score: -1,
      issues: [],
      suggestions: [],
      summary: 'Análisis IA omitido por falta de API key.',
      skipped: true
    };
  }

  const prompt = `Eres un experto en Spec-Driven Development. Analiza estos 3 archivos de especificación y determina su coherencia.

REQUIREMENTS.md:
${cleanContent(files.requirements.content)}

DESIGN.md:
${cleanContent(files.design.content)}

TASKS.md:
${cleanContent(files.tasks.content)}

Responde SOLO en JSON con esta estructura exacta:
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
- ¿El diseño es suficiente para implementar los requisitos?`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un validador de especificaciones SDD que responde estrictamente en JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en API de Groq (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('La API de Groq devolvió una respuesta vacía.');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Análisis completado.'
      };
    } catch (parseError) {
      core.error(`Error al parsear JSON de la IA: ${content}`);
      return {
        score: 50,
        issues: ['Error de parseo en la respuesta de la IA'],
        suggestions: ['Reintentar el análisis o verificar el formato de salida'],
        summary: 'No se pudo procesar la respuesta estructurada de la IA.'
      };
    }

  } catch (error: any) {
    core.warning(`Error durante el análisis IA: ${error.message}`);
    return {
      score: -1,
      issues: [`Error técnico: ${error.message}`],
      suggestions: ['Verificar la conexión y la validez de la API key'],
      summary: 'El análisis IA falló debido a un error técnico.',
      skipped: true
    };
  }
}
