import { app } from '@azure/functions';
import { HttpHandlerFactory } from '@gpkit/azure-functions/bootstrap/http';
import { PingModule } from './ping.module';
import { EnvConstants } from '../../../common/constants/env.constants';
import { PingTriggerConstants } from '../constants/ping-trigger.constants';
import { PingController } from '../controller/ping.controller';

app.http(PingTriggerConstants.FUNCTION_NAME, {
  methods: PingTriggerConstants.METHODS,
  authLevel: 'function',
  route: PingTriggerConstants.ROUTE,
  handler: new HttpHandlerFactory().build(PingModule, PingController, EnvConstants.REQUERIDAS_PING),
});
