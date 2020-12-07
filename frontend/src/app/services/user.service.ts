import { environment } from './../../environments/environment';
import { User } from './../models/user';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  ruta = environment.apiURL + '/user';

  getUsers(){
    return this.http.get<User[]>(this.ruta + '/all');
  }

  changeUsername(username: string){
    return this.http.post(this.ruta + '/setusername/' + username, null);
  }
}
