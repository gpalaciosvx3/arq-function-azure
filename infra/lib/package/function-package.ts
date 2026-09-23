import * as fs from 'fs';
import * as path from 'path';
import { buildSync } from 'esbuild';
import { configDir, functionBundling, outDir, srcDir } from './bundling.config';
import { InfraConstants } from '../../common/constants/infra.constants';

export class FunctionPackage {
  constructor(private readonly functionAppName: string) {}

  build(): string[] {
    const entryPoints = this.findHandlers();
    fs.rmSync(outDir, { recursive: true, force: true });
    buildSync({ ...functionBundling, entryPoints, outdir: outDir });
    this.copyConfig();
    this.writeManifest();
    return entryPoints;
  }

  private findHandlers(): string[] {
    return fs
      .readdirSync(srcDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(srcDir, entry.name, 'infrastructure', 'bootstrap'))
      .filter((dir) => fs.existsSync(dir))
      .flatMap((dir) =>
        fs
          .readdirSync(dir)
          .filter((file) => file.endsWith(InfraConstants.HANDLER_SUFFIX))
          .map((file) => path.join(dir, file)),
      );
  }

  private copyConfig(): void {
    [InfraConstants.HOST_FILE, InfraConstants.LOCAL_SETTINGS_FILE]
      .map((file) => path.join(configDir, file))
      .filter((file) => fs.existsSync(file))
      .forEach((file) => fs.copyFileSync(file, path.join(outDir, path.basename(file))));
  }

  private writeManifest(): void {
    const manifest = { name: this.functionAppName, main: InfraConstants.HANDLER_GLOB };
    fs.writeFileSync(
      path.join(outDir, InfraConstants.MANIFEST_FILE),
      JSON.stringify(manifest, null, 2),
    );
  }
}
