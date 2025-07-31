import js from '@eslint/js';
import next from 'eslint-config-next-flat';

export default [
  { ignores: ['.next', 'node_modules', 'out', 'public', 'dist', '**/*.min.js'] },
  js.configs.recommended,
  next,
]; 