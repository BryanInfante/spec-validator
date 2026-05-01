import * as core from '@actions/core';
import * as github from '@actions/github';
import { ValidationResult } from './types';

const COMMENT_TAG = '<!-- spec-validator-comment -->';

export function buildComment(result: ValidationResult): string {
  const { check, tasks, analysis, overallScore, passed } = result;
  
  const statusBadge = passed ? '✅' : (overallScore > 0 ? '⚠️' : '❌');
  
  let markdown = `## 🔍 Spec Validator\n\n`;
  markdown += `**Score de coherencia: ${overallScore}/100** ${statusBadge}\n\n`;

  markdown += `### Verificación básica\n`;
  Object.entries(check.files).forEach(([key, file]) => {
    const fileName = key.toUpperCase() + '.md';
    const hasError = check.errors.some(e => e.file === fileName);
    const icon = hasError ? '❌' : '✅';
    const detail = hasError 
      ? check.errors.find(e => e.file === fileName)?.message 
      : `encontrado (${file.size} chars)`;
    markdown += `- ${icon} ${fileName} ${detail}\n`;
  });
  markdown += `\n`;

  markdown += `### Tareas\n`;
  markdown += `- ✅ ${tasks.completed} completadas / ${tasks.total - tasks.completed} pendientes\n`;
  if (tasks.inProgress > 0) {
    markdown += `- 🚧 ${tasks.inProgress} en progreso\n`;
  }
  markdown += `\n`;

  if (analysis && !analysis.skipped) {
    markdown += `### Análisis IA\n`;
    markdown += `> ${analysis.summary}\n\n`;
    
    if (analysis.issues.length > 0) {
      markdown += `#### Issues detectados\n`;
      analysis.issues.forEach(issue => markdown += `- ⚠️ ${issue}\n`);
      markdown += `\n`;
    }

    if (analysis.suggestions.length > 0) {
      markdown += `#### Sugerencias\n`;
      analysis.suggestions.forEach(sug => markdown += `- 💡 ${sug}\n`);
      markdown += `\n`;
    }
  } else if (analysis?.skipped) {
    markdown += `### Análisis IA\n`;
    markdown += `> ⚠️ Análisis IA omitido. Verifica que \`groq-api-key\` esté configurada.\n\n`;
  }

  markdown += `---\n`;
  markdown += `*Generado por [spec-validator](https://github.com/BryanInfante/spec-validator)*\n`;
  markdown += COMMENT_TAG;

  return markdown;
}

export async function postOrUpdateComment(result: ValidationResult, token: string): Promise<void> {
  if (!token) {
    core.warning('No se proporcionó GITHUB_TOKEN. No se podrá publicar el comentario en el PR.');
    return;
  }

  const context = github.context;
  if (!context.payload.pull_request) {
    core.info('No es un Pull Request. Se omite el comentario.');
    return;
  }

  const octokit = github.getOctokit(token);
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;

  const body = buildComment(result);

  try {
    // Buscar comentario previo del bot
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number
    });

    const botComment = comments.find(comment => comment.body?.includes(COMMENT_TAG));

    if (botComment) {
      core.info(`Actualizando comentario previo (ID: ${botComment.id})...`);
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: botComment.id,
        body
      });
    } else {
      core.info('Creando nuevo comentario en el PR...');
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body
      });
    }
  } catch (error: any) {
    core.error(`Error al gestionar comentario en GitHub: ${error.message}`);
  }
}
