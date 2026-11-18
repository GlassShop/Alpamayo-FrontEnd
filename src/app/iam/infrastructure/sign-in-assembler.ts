import {SignInCommand} from '../domain/model/sign-in.command';
import {Session, SESSION_HOURS} from '../domain/model/session';
import {User} from '../domain/model/user.entity';
import {isRole} from '../domain/model/role';
import {SignInResponse, UserResource} from './sign-in-response';
import {SignInRequest} from './sign-in.request';

/** Maps between the sign-in API contract and the IAM domain. */
export class SignInAssembler {
  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {username: command.username.trim(), password: command.password};
  }

  /**
   * Builds the session. The expiry is capped at one shift even if the server
   * grants a longer token, and an unknown role is rejected.
   */
  toSessionFromResponse(response: SignInResponse, now = Date.now()): Session {
    const maxExpiry = now + SESSION_HOURS * 3_600_000;
    const serverExpiry = Date.parse(response.expiresAt);
    return {
      token: response.token,
      user: toUserFromResource(response.user),
      expiresAt: Number.isFinite(serverExpiry) ? Math.min(serverExpiry, maxExpiry) : maxExpiry,
    };
  }
}

export function toUserFromResource(resource: UserResource): User {
  if (!isRole(resource.role)) throw new Error(`Unknown role: ${resource.role}`);
  return {
    id: resource.id,
    username: resource.username,
    fullName: resource.fullName,
    role: resource.role,
    active: resource.active !== false,
  };
}
