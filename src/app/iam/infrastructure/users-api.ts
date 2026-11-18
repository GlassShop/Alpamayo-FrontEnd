import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role';
import {toUserFromResource} from './sign-in-assembler';
import {CreateUserRequest, UpdateUserRequest, UserResource} from './users-response';

export interface NewUser {
  username: string;
  fullName: string;
  role: Role;
  password: string;
}

/** Account administration (CEO only on the server side). */
@Injectable({providedIn: 'root'})
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.usersEndpointPath}`;

  getAll(): Observable<User[]> {
    return this.http.get<UserResource[]>(this.url).pipe(map(list => list.map(toUserFromResource)));
  }

  create(user: NewUser): Observable<User> {
    const body: CreateUserRequest = {...user, username: user.username.trim(), fullName: user.fullName.trim(), active: true};
    return this.http.post<UserResource>(this.url, body).pipe(map(toUserFromResource));
  }

  update(id: number, changes: UpdateUserRequest): Observable<User> {
    return this.http.patch<UserResource>(`${this.url}/${id}`, changes).pipe(map(toUserFromResource));
  }
}
