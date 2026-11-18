export type {UserResource} from './sign-in-response';

/** Body to create an account. The server stores only a hash of the password. */
export interface CreateUserRequest {
  username: string;
  fullName: string;
  role: string;
  password: string;
  active: boolean;
}

/** Partial update of an account: role, active flag or a new password. */
export interface UpdateUserRequest {
  role?: string;
  active?: boolean;
  password?: string;
}
