import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {SignInApiEndpoint} from './sign-in-api-endpoint';
import {SignInAssembler} from './sign-in-assembler';
import {SignInCommand} from '../domain/model/sign-in.command';
import {SignInResource} from './sign-in-response';

/**
 * Infrastructure facade for IAM HTTP operations.
 *
 * @remarks
 * Public sign-up was removed on purpose: only the CEO creates user accounts.
 */
@Injectable({providedIn: 'root'})
export class IamApi extends BaseApi {
  private readonly signInEndpoint: SignInApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.signInEndpoint = new SignInApiEndpoint(http, new SignInAssembler());
  }

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    return this.signInEndpoint.signIn(signInCommand);
  }
}
