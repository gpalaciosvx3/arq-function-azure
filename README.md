<p align="center">
  <a href="https://gustavopalacios.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gpalaciosvx3/gpalaciosvx3/master/assets/brand/logo-dark.svg">
      <img src="https://raw.githubusercontent.com/gpalaciosvx3/gpalaciosvx3/master/assets/brand/logo-light.svg" alt="Gustavo Palacios" height="64">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://gustavopalacios.dev"><img src="https://img.shields.io/badge/web-gustavopalacios.dev-17a267?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI%2BPGRlZnM%2BPG1hc2sgaWQ9Im0iPjxwYXRoIGQ9Ik0zMiAyIEw1OCAxNyBMNTggNDcgTDMyIDYyIEw2IDQ3IEw2IDE3IFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjggMTQgTDE3LjUgNTAgTTI4IDE0IEw0Ni41IDUwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNC44IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSIyOCIgY3k9IjE0IiByPSI0LjYiIGZpbGw9IiMwMDAiLz48L21hc2s%2BPC9kZWZzPjxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIG1hc2s9InVybCgjbSkiLz48L3N2Zz4%3D" alt="Web"></a>
  <a href="https://www.npmjs.com/org/gpkit"><img src="https://img.shields.io/badge/npm-%40gpkit-CB3837?logo=npm&logoColor=white" alt="npm @gpkit"></a>
  <a href="https://www.linkedin.com/in/gustavopalaciosv"><img src="https://img.shields.io/badge/LinkedIn-gustavopalaciosv-0A66C2?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0yMC40NSAyMC40NWgtMy41NnYtNS41N2MwLTEuMzMtLjAzLTMuMDQtMS44NS0zLjA0LTEuODYgMC0yLjE0IDEuNDUtMi4xNCAyLjk0djUuNjdIOS4zNVY5aDMuNDF2MS41NmguMDVjLjQ4LS45IDEuNjQtMS44NSAzLjM3LTEuODUgMy42IDAgNC4yNyAyLjM3IDQuMjcgNS40NnY2LjI4ek01LjM0IDcuNDNhMi4wNiAyLjA2IDAgMSAxIDAtNC4xMyAyLjA2IDIuMDYgMCAwIDEgMCA0LjEzek03LjEyIDIwLjQ1SDMuNTZWOWgzLjU2djExLjQ1eiIvPjwvc3ZnPg%3D%3D" alt="LinkedIn"></a>
  <a href="https://github.com/gpalaciosvx3"><img src="https://img.shields.io/badge/GitHub-gpalaciosvx3-181717?logo=github&logoColor=white" alt="GitHub"></a>
</p>

# arq-function-azure

Arquetipo de **Azure Function** (modelo de programación v4 de Node) con NestJS, Clean Architecture y pruebas BDD. Es solo código: el Function App y toda la infraestructura viven en el repo de IaC. Incluye la feature de referencia `ping/pong`.

| Ficha | |
|---|---|
| Destino | Azure Functions (plan Flex Consumption) |
| Runtime | Node.js 22 · TypeScript 5.5 strict |
| Framework | NestJS 10 (context-based, sin servidor HTTP) |
| Plataforma | `@gpkit/core` · `@gpkit/azure-functions` · `@gpkit/arch-rules` |
| Artefacto | Paquete zip (`dist/`) montado sobre un Function App existente |
| Despliegue | `azure-functions-deploy` |
| Contrato IaC | Nomenclatura `{REGION}{PROYECTO}{SERVICIO}{NNN}` |

---

## Índice

1. [Alcance](#1-alcance)
2. [Arquitectura](#2-arquitectura)
3. [Plataforma](#3-plataforma)
4. [Feature de referencia](#4-feature-de-referencia)
5. [Desarrollo local](#5-desarrollo-local)
6. [Calidad](#6-calidad)
7. [Despliegue](#7-despliegue)
8. [Contrato con IaC](#8-contrato-con-iac)
9. [Anexos](#9-anexos)

---

## 1. Alcance

| Recurso | Dónde vive |
|---|---|
| Código de la función y declaración de su trigger (`app.http`, `app.storageQueue`, …) | **Aquí** (`src/`) |
| Empaquetado y Function App destino | **Aquí** (`infra/`, no crea recursos) |
| Function App, plan, storage account, Application Insights | IaC |
| App settings (nombres de colas, connection strings, Key Vault references) | IaC |
| API Management: API pública, operaciones, políticas, CORS, dominio | IaC |
| Colas, Service Bus, Event Grid, Cosmos DB | IaC |

---

## 2. Arquitectura

### Estructura

```
arq-function-azure/
  src/
    common/
      constants/env.constants.ts      # Variables de entorno obligatorias por función
      errors/app.error-dictionary.ts  # Errores de negocio propios (prefijo ARQ-)
    ping/
      domain/                         # Agnóstico de la nube — solo @gpkit/core
        constants/  mapper/  service/  types/
      application/                    # Agnóstico de la nube — solo @gpkit/core
        dtos/  use-cases/
      infrastructure/                 # Lo único propio de Azure Functions en src/
        bootstrap/                    # PingModule + ping.handler.ts (app.http + factory)
        constants/                    # Nombre, ruta y métodos del trigger
        controller/                   # PingController + @HandleExecution + HttpHelper
  test/
    ping/                             # features/*.feature + *.steps.ts
  infra/
    bin/package.ts                    # Entry point — arma dist/
    lib/
      package/
        bundling.config.ts            # Opciones de esbuild compartidas
        function-package.ts           # Bundles + host.json + manifiesto con el Function App destino
    common/constants/
      naming.constants.ts             # Nombre canónico del Function App — el contrato con IaC
      resource.constants.ts           # Alias semánticos
      infra.constants.ts              # Target de Node, nombres de archivo del paquete
    config/
      host.json                       # Configuración del host de Functions
      local.settings.example.json     # Plantilla de local.settings.json (no versionado)
    tsconfig.json
```

### Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22, TypeScript 5.5 strict |
| Framework | NestJS 10 |
| Modelo de Functions | `@azure/functions` v4 |
| Observabilidad | `InvocationContext` → Application Insights (vía `@gpkit/azure-functions`) |
| Validación | Zod 3.x |
| Tests | jest-cucumber 4.x |
| Arquitectura | dependency-cruiser + `@gpkit/arch-rules` |
| Empaquetado | esbuild |
| Calidad | ESLint + Prettier + Husky |

### Capas

`domain/` y `application/` importan únicamente `@gpkit/core`: el logger lo obtienen con `getLogger()`, que la factory deja registrado al arrancar. Solo `infrastructure/` conoce `@azure/functions` y `@gpkit/azure-functions`.

---

## 3. Plataforma

| Paquete | Qué aporta |
|---|---|
| `@gpkit/core` | `CustomException`, `ValidationException`, `ErrorDictionary`, `getLogger()`, `@HandleExecution`, tipos `ApiSuccessBody` / `ApiErrorBody`, procesamiento por lotes |
| `@gpkit/azure-functions` | `HttpHandlerFactory`, `HttpHelper`, logger ligado a la invocación |
| `@gpkit/arch-rules` | Perfil de dependency-cruiser con las fronteras entre capas |

**No instalado:** no existe aún un paquete de clientes de servicios de Azure. Nacerá en `pt-npm-packages` con el primer servicio real (Blob, Queue, Service Bus, Cosmos DB).

**Regla dura:** si una librería resuelve lo que necesitas, se usa. Si no cubre un caso real —hoy `@gpkit/azure-functions` trae solo el trigger HTTP— se agrega en `pt-npm-packages`, no aquí.

---

## 4. Feature de referencia

La ruta del Function App es interna y exige la function key. El endpoint público lo declara IaC en API Management.

```
POST /api/ping?code=<function-key>
Content-Type: application/json

{ "message": "hello" }
```

**`200`**

```json
{ "data": { "message": "pong", "echo": "hello", "receivedAt": "2026-05-27T10:00:00.000Z" } }
```

**`400`** — mensaje vacío

```json
{
  "code": "CORE-001",
  "description": "El cuerpo de la solicitud no es válido",
  "issues": [{ "path": ["message"], "message": "String must contain at least 1 character(s)" }]
}
```

| Código | HTTP | Descripción |
|---|---|---|
| `CORE-001` | 400 | El cuerpo de la solicitud no es válido |
| `CORE-002` | 500 | Ocurrió un error inesperado |
| `CORE-003` | 500 | Variable de entorno requerida no encontrada |
| `CORE-004` | 403 | No tiene autorización para acceder a este recurso |

Los `CORE-*` vienen de `@gpkit/core`. Los errores de negocio van en `src/common/errors/app.error-dictionary.ts` con prefijo propio.

---

## 5. Desarrollo local

```bash
npm install
```

Para correr la función hacen falta [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local) y, para triggers que no sean HTTP, [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite):

```bash
cp infra/config/local.settings.example.json infra/config/local.settings.json
npm start          # build + func start dentro de dist/

curl -X POST http://localhost:7071/api/ping \
  -H 'Content-Type: application/json' \
  -d '{"message": "hello"}'
```

En local no se exige la function key.

---

## 6. Calidad

| Script | Qué verifica |
|---|---|
| `npm run typecheck` | Tipos de `src/`, `test/` e `infra/` |
| `npm run lint` | ESLint |
| `npm run arch:check` | Fronteras de capas sobre `src/` e `infra/` |
| `npm test` | Escenarios BDD (jest-cucumber) con cobertura mínima del 80% |
| `npm run format` | Prettier |

Reglas de `arch:check`: ninguna feature importa internos de otra; `domain/` no conoce `application/` ni `infrastructure/`; `application/` no conoce `infrastructure/`; `src/common/` no depende de features; `src/` e `infra/` no se cruzan. La carpeta **debe** llamarse `infra/`: las reglas anclan ahí su ruta.

Hooks: `lint-staged` en `pre-commit`, `arch:check` en `pre-push`.

---

## 7. Despliegue

| Workflow | Disparador | Acción |
|---|---|---|
| `deploy.yml` | `pull_request` a `master` | `node-validate`: tipos, lint, `arch:check`, tests y `npm run build` |
| `deploy.yml` | `push` a `master` | `azure-functions-deploy` |
| `deploy-manual.yml` | Manual | Despliega cualquier rama, tag o SHA |

No hay workflow de destroy: el repo no es dueño de ningún recurso. Las plantillas viven en `pt-ci-pipelines` y autentican por OIDC (`azure/login`).

**Variables del environment `deployer`**

| Variable | Uso |
|---|---|
| `AZURE_CLIENT_ID` | Identidad con credencial federada para el repo |
| `AZURE_TENANT_ID` | Tenant de Entra ID |
| `AZURE_SUBSCRIPTION_ID` | Suscripción destino |

Son comunes a todos los repos y pueden definirse a nivel de organización. La identidad necesita el rol **Website Contributor** sobre el Function App.

**Qué despliega:** el contenido de `dist/` (ver [9.1](#91-empaquetado)) sobre el Function App `UE1ARQFNA001`. El nombre no es una variable: sale del manifiesto del paquete.

---

## 8. Contrato con IaC

**Nomenclatura, sin SSM.** Ambos lados construyen el mismo nombre con `{REGION}{PROYECTO}{SERVICIO}{NNN}`: Terraform crea el recurso y este repo lo declara en `infra/common/constants/naming.constants.ts`.

| Dirección | Qué | Cómo |
|---|---|---|
| IaC → función | Function App `UE1ARQFNA001` | Lo crea IaC; este repo solo sube código a ese nombre |
| IaC → función | Endpoint público | Operación de API Management que reenvía al Function App con la function key guardada como named value |
| IaC → función | Nombres de colas, conexiones | App settings del Function App, leídos como variables de entorno (`EnvConstants`) |

- **Orden del primer despliegue:** IaC primero, este repo después.

---

## 9. Anexos

### 9.1 Empaquetado

`npm run build` deja en `dist/` exactamente lo que se monta en el Function App:

```
dist/
  host.json
  package.json          # { "name": "UE1ARQFNA001", "main": "*.handler.js" }
  ping.handler.js       # bundle con NestJS, @gpkit/* y la feature
```

- El `name` es el Function App destino, tomado de `ResourceConstants.FUNCTION_APP`. `azure-functions-deploy` lo lee de ahí.
- Un bundle por archivo `src/<feature>/infrastructure/bootstrap/*.handler.ts`: una feature nueva se registra sola.
- Sin `node_modules`: el despliegue no depende de un build remoto.
- `@azure/functions-core` queda fuera del bundle: lo inyecta el worker de Node en tiempo de ejecución.
- esbuild no soporta `emitDecoratorMetadata`. Por eso el wiring de `ping.module.ts` es explícito con `useFactory`: la regla de estilo es además la que hace posible el bundle.

### 9.2 Observabilidad

`HttpHandlerFactory.build()` registra en `@gpkit/core` un logger que escribe por el `InvocationContext` de la invocación en curso, con el formato `--- feature start/end ---` y `[PASO N]`. Application Insights correlaciona cada línea con su `invocationId` y recolecta requests y dependencias por su cuenta.
