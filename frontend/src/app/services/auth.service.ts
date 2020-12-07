import { Token } from './../models/token';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
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

  signout(token: Token){
    return this.http.put<User>(environment.apiURL + '/auth/signout', token);
  }

  /******* AUXILIAR FUNCTIONS **********/

  encryptPassword(password: string){
    try {
      var cipherPsswd = CryptoJS.SHA256(password).toString();
      return cipherPsswd;
    } catch (e) {
      console.log(e);
    }
  }

  isLoggedIn(){
    //TRUE si esta, FALSE si no
    return localStorage.getItem('ACCESS_TOKEN') !== null;
  }

  getToken(){
    return localStorage.getItem('ACCESS_TOKEN');
  }
}
