import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(user: Object){
    return this.http.post(environment.apiURL + '/auth/login', user);
  }

  register(user: Object){
    return this.http.post(environment.apiURL + '/auth/register', user);
  }
}
