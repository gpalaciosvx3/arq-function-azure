import { HttpHelper } from '@gpkit/azure-functions/http';
import { HandleExecution } from '@gpkit/core';
import { Injectable, HttpStatus } from '@nestjs/common';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import type { HttpResponseInit } from '@azure/functions';
import type { HttpController, HttpHandlerEvent } from '@gpkit/azure-functions/bootstrap/http';

@Injectable()
export class PingController implements HttpController {
  constructor(private readonly useCase: PingUseCase) {}

  @HandleExecution('Ping', HttpHelper.error)
  async handle(event: HttpHandlerEvent): Promise<HttpResponseInit> {
    return HttpHelper.success(HttpStatus.OK, this.useCase.execute(event.parsed.body));
  }
}
