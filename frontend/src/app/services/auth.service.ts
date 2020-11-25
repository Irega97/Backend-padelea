import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  iv;

  constructor(private http: HttpClient) { }

  login(user: Object){
    return this.http.post(environment.apiURL + '/auth/login', user);
  }

  register(user: Object){
    return this.http.post(environment.apiURL + '/auth/register', user);
  }

  encryptPassword(password: string){
    try {
      var cipherPsswd = CryptoJS.SHA256(password).toString();
      return cipherPsswd;
    } catch (e) {
      console.log(e);
    }
  }
}
