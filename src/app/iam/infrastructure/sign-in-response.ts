import {BaseResource} from '../../shared/infrastructure/base-response';

/** User as returned by the API (never includes the password). */
export interface UserResource extends BaseResource {
  username: string;
  fullName: string;
  role: string;
  active: boolean;
}

/** Body of a successful sign-in. */
export interface SignInResponse {
  token: string;
  /** ISO-8601 date-time when the token expires. */
  expiresAt: string;
  user: UserResource;
}
