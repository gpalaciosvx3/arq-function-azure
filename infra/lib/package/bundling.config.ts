import * as path from 'path';
import { InfraConstants } from '../../common/constants/infra.constants';
import type { BuildOptions } from 'esbuild';

export const repoRoot = path.join(__dirname, '../../../');

export const srcDir = path.join(repoRoot, 'src');

export const configDir = path.join(repoRoot, 'infra/config');

export const outDir = path.join(repoRoot, 'dist');

export const functionBundling: BuildOptions = {
  bundle: true,
  platform: 'node',
  target: InfraConstants.NODE_TARGET,
  format: 'cjs',
  entryNames: '[name]',
  tsconfig: path.join(repoRoot, 'tsconfig.json'),
  external: [
    '@azure/functions-core',
    'class-transformer',
    'class-validator',
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
    '@nestjs/platform-express',
  ],
};
