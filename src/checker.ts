import * as fs from 'fs';
import * as path from 'path';
import { CheckResult, SpecFiles, FileContent, CheckError } from './types';

const MIN_SIZE = 100;

export function checkFiles(basePath: string): CheckResult {
  const errors: CheckError[] = [];
  
  const files: SpecFiles = {
    requirements: getFileData(basePath, 'REQUIREMENTS.md'),
    design: getFileData(basePath, 'DESIGN.md'),
    tasks: getFileData(basePath, 'TASKS.md'),
  };

  Object.entries(files).forEach(([key, file]) => {
    const fileName = path.basename(file.path);
    
    if (!file.exists) {
      errors.push({
        file: fileName,
        message: `Archivo ${fileName} no encontrado`,
        type: 'missing'
      });
      return;
    }

    if (file.size < MIN_SIZE) {
      errors.push({
        file: fileName,
        message: `El archivo ${fileName} es demasiado corto (${file.size} bytes). Mínimo ${MIN_SIZE} bytes.`,
        type: 'too-short'
      });
    }

    if (!file.content.includes('#')) {
      errors.push({
        file: fileName,
        message: `El archivo ${fileName} no contiene headers Markdown (#).`,
        type: 'no-header'
      });
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    files
  };
}

function getFileData(basePath: string, fileName: string): FileContent {
  const filePath = path.join(basePath, fileName);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return { path: filePath, content: '', exists: false, size: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    path: filePath,
    content,
    exists: true,
    size: content.length
  };
}
