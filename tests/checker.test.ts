import * as fs from 'fs';
import * as path from 'path';
import { checkFiles } from '../src/checker';

const TEMP_TEST_DIR = path.join(__dirname, 'temp_test_checker');

describe('checker', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_TEST_DIR);
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  function createMockFile(name: string, content: string) {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, name), content);
  }

  test('debe pasar con archivos válidos', () => {
    const validContent = '# Title\n' + 'a'.repeat(100);
    createMockFile('REQUIREMENTS.md', validContent);
    createMockFile('DESIGN.md', validContent);
    createMockFile('TASKS.md', validContent);

    const result = checkFiles(TEMP_TEST_DIR);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('debe fallar si falta un archivo', () => {
    const validContent = '# Title\n' + 'a'.repeat(100);
    createMockFile('REQUIREMENTS.md', validContent);
    // Falta DESIGN.md
    createMockFile('TASKS.md', validContent);

    const result = checkFiles(TEMP_TEST_DIR);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.file === 'DESIGN.md' && e.type === 'missing')).toBe(true);
  });

  test('debe fallar si un archivo es demasiado corto', () => {
    const validContent = '# Title\n' + 'a'.repeat(100);
    createMockFile('REQUIREMENTS.md', validContent);
    createMockFile('DESIGN.md', '# Short'); // < 100 bytes
    createMockFile('TASKS.md', validContent);

    const result = checkFiles(TEMP_TEST_DIR);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.file === 'DESIGN.md' && e.type === 'too-short')).toBe(true);
  });

  test('debe fallar si no tiene headers Markdown', () => {
    const validContent = '# Title\n' + 'a'.repeat(100);
    const noHeaderContent = 'a'.repeat(110);
    createMockFile('REQUIREMENTS.md', validContent);
    createMockFile('DESIGN.md', noHeaderContent);
    createMockFile('TASKS.md', validContent);

    const result = checkFiles(TEMP_TEST_DIR);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.file === 'DESIGN.md' && e.type === 'no-header')).toBe(true);
  });
});
