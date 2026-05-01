export interface FileContent {
  path: string;
  content: string;
  exists: boolean;
  size: number;
}

export interface SpecFiles {
  requirements: FileContent;
  design: FileContent;
  tasks: FileContent;
}

export interface CheckError {
  file: string;
  message: string;
  type: 'missing' | 'too-short' | 'no-header';
}

export interface CheckResult {
  passed: boolean;
  errors: CheckError[];
  files: SpecFiles;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}

export interface AnalysisResult {
  score: number;
  issues: string[];
  suggestions: string[];
  summary: string;
  skipped?: boolean;
}

export interface ValidationResult {
  check: CheckResult;
  tasks: TaskStats;
  analysis?: AnalysisResult;
  overallScore: number;
  passed: boolean;
}
