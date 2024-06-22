/* eslint-disable import/no-extraneous-dependencies */
import { includeIgnoreFile } from '@eslint/compat';
import baseConfig from '@wyattades/eslint-config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  ...baseConfig,
  {
    rules: {
      'no-console': 'off',
    },
  },
];
