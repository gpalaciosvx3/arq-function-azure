# arq-function-azure

Arquetipo de **Azure Function** (modelo de programación v4 de Node) con NestJS, Clean Architecture y pruebas BDD. Incluye una feature de referencia `ping/pong` completa.

El repo es **solo código**. El Function App, su plan, el storage account, Application Insights, los app settings y todo lo compartido —API Management, colas, Service Bus, bases de datos— viven en el repo de IaC (Terraform). `infra/` aquí no crea recursos: solo empaqueta y dice a qué Function App va el código.

Es el gemelo de [`arq-function-aws`](https://github.com/gpalaciosvx3/arq-function-aws). `domain/`, `application/` y `test/` son **idénticos** en ambos; cambia solo `infrastructure/` y la forma de desplegar.

---

## Índice

- [Qué es de este repo y qué no](#qué-es-de-este-repo-y-qué-no)
- [Diferencias con el gemelo AWS](#diferencias-con-el-gemelo-aws)
- [Las librerías de la plataforma](#las-librerías-de-la-plataforma)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Feature de referencia: ping/pong](#feature-de-referencia-pingpong)
- [Empaquetado](#empaquetado)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [CI/CD](#cicd)

---

## Qué es de este repo y qué no

| Recurso | Dónde vive |
|---|---|
| El código de la función y la declaración de su trigger (`app.http`, `app.storageQueue`, …) | **Aquí** |
| Function App, plan Flex Consumption, storage account, Application Insights | IaC |
| App settings de la función (nombres de colas, connection strings, Key Vault references) | IaC |
| API Management: la API pública, sus operaciones, políticas, CORS, dominio | IaC |
| Colas, Service Bus, Event Grid, Cosmos DB | IaC |

En Azure Functions el trigger **se declara en el código**, no es un recurso aparte: no hay equivalente al event source mapping ni al permiso de invocación de Lambda. Por eso este repo no necesita IaC propia y el de AWS sí necesita un mínimo.

### Y el endpoint, ¿no quedaba en IaC?

Sí. La ruta de `app.http` es **interna** del Function App (`https://<app>.azurewebsites.net/api/ping`) y exige la function key (`authLevel: 'function'`). El endpoint que consumen los clientes es una operación de **API Management**, declarada en IaC, que reenvía al Function App con la key guardada como named value. Es el mismo reparto que en AWS entre el HTTP API (IaC) y la función (este repo).

---

## Diferencias con el gemelo AWS

| | `arq-function-aws` | `arq-function-azure` |
|---|---|---|
| Factory | `ApiGwHandlerFactory` (`@gpkit/aws-lambda`) | `HttpHandlerFactory` (`@gpkit/azure-functions`) |
| Controller | `ApiGwController` + `ApiGwHelper` | `HttpController` + `HttpHelper` |
| Registro del trigger | IaC: la integración invoca la función por nombre | Código: `app.http(...)` en `ping.handler.ts` |
| Nombre del destino | `infra/common/constants/naming.constants.ts` (función) | `infra/common/constants/naming.constants.ts` (Function App) |
| Constantes del trigger | — (IaC declara la ruta) | `src/ping/infrastructure/constants/ping-trigger.constants.ts` |
| Empaquetado | esbuild vía `NodejsFunction` (`lib/.../bundling.config.ts`) | esbuild vía `FunctionPackage` (`lib/package/bundling.config.ts`) |
| Qué ejecuta `infra/` | `cdk deploy`: crea la función y su rol | `npm run build`: arma `dist/`, que `Azure/functions-action` sube al Function App |
| Logging | Powertools (JSON + X-Ray + EMF) | `InvocationContext` → Application Insights, correlacionado por `invocationId` |
| Despliegue | `aws-cdk-deploy` | `azure-functions-deploy` |
| Destroy | `aws-cdk-destroy` | No existe: el repo no es dueño de ningún recurso |

Lo que **no** cambia: la forma de `event.parsed` (`body`, `params`/`pathParameters`, `query`, `headers`), los cuerpos de respuesta `ApiSuccessBody` / `ApiErrorBody`, los errores `CORE-*` y el formato de logs `--- start/end ---` y `[PASO N]`.

---

## Las librerías de la plataforma

| Paquete | Qué aporta a este proyecto |
|---|---|
| `@gpkit/core` | `CustomException`, `ValidationException`, `ErrorDictionary`, contrato `Logger` + `getLogger()`, `@HandleExecution`, tipos `ApiSuccessBody`/`ApiErrorBody`, procesamiento por lotes |
| `@gpkit/azure-functions` | `HttpHandlerFactory`, `HttpHelper`, logger ligado a la invocación |
| `@gpkit/arch-rules` | Perfil de dependency-cruiser que verifica las fronteras entre capas |

**Regla dura:** si algo de una librería resuelve lo que necesitas, se usa. Si no cubre un caso real —hoy `@gpkit/azure-functions` trae solo el trigger HTTP— se agrega allí, en `pt-npm-packages`, no aquí.

**Solo `infrastructure/` importa `@gpkit/azure-functions` y `@azure/functions`.** `domain/` y `application/` usan únicamente `@gpkit/core`.

---

## Estructura del proyecto

```
arq-function-azure/
  src/
    common/
      constants/env.constants.ts   # Variables de entorno obligatorias por función
      errors/app.error-dictionary.ts  # Errores de negocio propios (prefijo ARQ-)
    ping/
      domain/                      # ← idéntico en arq-function-aws
      application/                 # ← idéntico en arq-function-aws
      infrastructure/              # ← lo único propio de Azure en src/
        bootstrap/                 # PingModule, ping.handler.ts (app.http + factory)
        constants/                 # Nombre, ruta y métodos del trigger
        controller/                # PingController + @HandleExecution + HttpHelper
  test/
    ping/                          # ← idéntico en arq-function-aws
  infra/                           # Todo lo de despliegue a Azure; no crea recursos
    bin/
      package.ts                   # Entry point — arma dist/ (equivale a bin/ping.ts de CDK)
    lib/
      package/
        bundling.config.ts         # Opciones de esbuild compartidas
        function-package.ts        # Bundles + host.json + manifiesto con el Function App destino
    common/
      constants/
        naming.constants.ts        # Nombre canónico del Function App — el contrato con IaC
        resource.constants.ts      # Alias semánticos
        infra.constants.ts         # Target de Node, nombres de archivo del paquete
    config/
      host.json                    # Configuración del host de Functions
      local.settings.example.json  # Plantilla de infra/config/local.settings.json (no versionado)
    tsconfig.json
```

---

## Feature de referencia: ping/pong

```
POST /api/ping?code=<function-key>
Content-Type: application/json

{ "message": "hello" }
```

**Response `200`:**
```json
{
  "data": {
    "message": "pong",
    "echo": "hello",
    "receivedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

**Response `400` — mensaje vacío:**
```json
{
  "code": "CORE-001",
  "description": "El cuerpo de la solicitud no es válido",
  "issues": [{ "path": ["message"], "message": "String must contain at least 1 character(s)" }]
}
```

---

## Empaquetado

`npm run build` deja en `dist/` exactamente lo que se monta en el Function App:

```
dist/
  host.json
  package.json          # { "name": "UE1ARQFNA001", "main": "*.handler.js" }
  ping.handler.js       # bundle con NestJS, @gpkit/* y la feature
```

- El `name` es el Function App destino, tomado de `ResourceConstants.FUNCTION_APP`. `azure-functions-deploy` lo lee de ahí: no hay variable con el nombre.
- Un bundle por archivo `src/<feature>/infrastructure/bootstrap/*.handler.ts`. Una feature nueva se registra sola.
- **Sin `node_modules`** en el despliegue, igual que en Lambda. El despliegue no depende de un build remoto.
- `@azure/functions-core` queda fuera del bundle: lo inyecta el worker de Node en tiempo de ejecución.
- NestJS se empaqueta sin `emitDecoratorMetadata` (esbuild no lo soporta). Por eso el wiring de `ping.module.ts` es explícito con `useFactory`, igual que en AWS: la regla de estilo es además la que hace posible el bundle.

---

## Instalación y desarrollo local

```bash
npm install

npm run typecheck
npm run lint
npm run arch:check
npm test
npm run format
```

Para correr la función en local hacen falta [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local) y, para triggers que no sean HTTP, [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite):

```bash
cp infra/config/local.settings.example.json infra/config/local.settings.json
npm start          # build + func start dentro de dist/

curl -X POST http://localhost:7071/api/ping \
  -H 'Content-Type: application/json' \
  -d '{"message": "hello"}'
```

En local no se exige la function key.

---

## CI/CD

| Archivo | Trigger | Acción |
|---|---|---|
| `deploy.yml` | `pull_request` a `master` | `node-validate`: tipos, lint, `arch:check`, tests y `npm run build` (lo detecta por `infra/config/host.json`) |
| `deploy.yml` | `push` a `master` | `azure-functions-deploy` |
| `deploy-manual.yml` | Manual | Despliega cualquier rama, tag o SHA |

Las plantillas viven en [`pt-ci-pipelines`](https://github.com/gpalaciosvx3/pt-ci-pipelines) y autentican por **OIDC** (`azure/login`): no hay publish profile ni secretos en el repo.

**Environment `deployer` — Variables:**

```
AZURE_CLIENT_ID          # Identidad con credencial federada para este repo
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

Son el equivalente del rol IAM de AWS: identidad, tenant y suscripción, comunes a todos los repos (se pueden definir a nivel de organización). La identidad solo necesita el rol **Website Contributor** sobre el Function App.
