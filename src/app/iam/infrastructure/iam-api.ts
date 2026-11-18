import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {SignInCommand} from '../domain/model/sign-in.command';
import {Session} from '../domain/model/session';
import {SignInApiEndpoint} from './sign-in-api-endpoint';
import {SignInAssembler} from './sign-in-assembler';

/**
 * Infrastructure facade for authentication.
 *
 * @remarks
 * There is no public sign-up: only the CEO creates accounts (see UsersApi).
 */
@Injectable({providedIn: 'root'})
export class IamApi extends BaseApi {
  private readonly signInEndpoint: SignInApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.signInEndpoint = new SignInApiEndpoint(http, new SignInAssembler());
  }

  signIn(command: SignInCommand): Observable<Session> {
    return this.signInEndpoint.signIn(command);
  }
}
