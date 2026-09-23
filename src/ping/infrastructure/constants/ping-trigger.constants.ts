import type { HttpMethod } from '@azure/functions';

export class PingTriggerConstants {
  static readonly FUNCTION_NAME = 'ping';

  static readonly ROUTE = 'ping';

  static readonly METHODS: HttpMethod[] = ['POST'];
}
