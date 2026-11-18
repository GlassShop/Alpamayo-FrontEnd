import {User} from './user.entity';

/** An authenticated session returned by the sign-in endpoint. */
export interface Session {
  token: string;
  user: User;
  /** Epoch milliseconds after which the session is no longer valid. */
  expiresAt: number;
}

/** Maximum session length: one work shift. */
export const SESSION_HOURS = 8;

export function isSessionValid(session: Session | null, now = Date.now()): session is Session {
  return !!session && !!session.token && session.user?.active !== false && session.expiresAt > now;
}
