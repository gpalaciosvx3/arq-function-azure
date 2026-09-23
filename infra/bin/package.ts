import { ResourceConstants } from '../common/constants/resource.constants';
import { FunctionPackage } from '../lib/package/function-package';

const handlers = new FunctionPackage(ResourceConstants.FUNCTION_APP).build();

console.warn(
  `Paquete de ${ResourceConstants.FUNCTION_APP} listo con ${handlers.length} función(es)`,
);
