import * as core from '@actions/core';
import { checkFiles } from './checker';
import { parseTasksMd } from './parser';
import { analyzeCoherence } from './analyzer';
import { postOrUpdateComment } from './commenter';
import { ValidationResult } from './types';

async function run(): Promise<void> {
  try {
    // 1. Leer inputs
    const groqKey = core.getInput('groq-api-key');
    const minScore = parseInt(core.getInput('min-score') || '70', 10);
    const filesPath = core.getInput('files-path') || '.';
    const githubToken = core.getInput('GITHUB_TOKEN', { required: false }) || process.env.GITHUB_TOKEN || '';

    core.info(`🚀 Iniciando validación de especificaciones en: ${filesPath}`);

    // 2. Verificación básica (Checker)
    core.info('🔍 Verificando archivos de especificación...');
    const checkResult = checkFiles(filesPath);

    // 3. Parser de tareas
    core.info('📋 Analizando progreso de tareas...');
    const taskStats = parseTasksMd(checkResult.files.tasks.content || '');

    // 4. Análisis IA (si hay key y pasaron los checks básicos)
    let analysisResult;
    if (checkResult.passed) {
      core.info('🧠 Ejecutando análisis de coherencia con IA...');
      analysisResult = await analyzeCoherence(checkResult.files, groqKey);
    } else {
      core.warning('⚠️ Se omitió el análisis IA debido a fallos en la verificación básica.');
    }

    // 5. Calcular resultado final
    const finalScore = analysisResult && !analysisResult.skipped ? analysisResult.score : (checkResult.passed ? 100 : 0);
    const passed = checkResult.passed && finalScore >= minScore;

    const validationResult: ValidationResult = {
      check: checkResult,
      tasks: taskStats,
      analysis: analysisResult,
      overallScore: finalScore,
      passed
    };

    // 6. Reportar en GitHub (Commenter)
    if (githubToken) {
      core.info('💬 Publicando reporte en el Pull Request...');
      await postOrUpdateComment(validationResult, githubToken);
    } else {
      core.warning('⚠️ No se encontró GITHUB_TOKEN. Se omite el comentario en el PR.');
    }

    // 7. Setear outputs
    core.setOutput('score', finalScore.toString());
    core.setOutput('passed', passed.toString());
    core.setOutput('issues-count', (checkResult.errors.length + (analysisResult?.issues.length || 0)).toString());

    // 8. Finalizar con éxito o error
    if (!checkResult.passed) {
      core.setFailed('❌ Falló la verificación básica de archivos (faltantes o demasiado cortos).');
    } else if (finalScore < minScore) {
      core.setFailed(`❌ El score de coherencia (${finalScore}) es menor al mínimo requerido (${minScore}).`);
    } else {
      core.info('✅ Validación completada exitosamente.');
    }

  } catch (error: any) {
    core.setFailed(`🚨 Error inesperado en la Action: ${error.message}`);
  }
}

run();
