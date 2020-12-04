import { SocialAuthService } from 'angularx-social-login';
import { UserService } from './../services/user.service';
import { Router } from '@angular/router';
import { environment } from './../../environments/environment';
import { AuthService } from './../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  users: User[];

  constructor(public authService: AuthService, public usersService: UserService, private http: HttpClient, private router: Router, private socialAuth: SocialAuthService) { }

  ngOnInit(): void {
    if(!this.authService.isLoggedIn()) {
      //SI NO ESTA LOGEADO, LE REDIRIGE A LA LANDING PAGE
      this.router.navigateByUrl('');
    } else {
      // SI NO TIENE ACCESO NO LE DEJARA VER LOS USUARIOS
      this.usersService.getUsers()
      .subscribe(users => {
        this.users = users;
      });
    }
  }

  signout(): void {
    let token = localStorage.getItem('ACCESS_TOKEN');
    const t = {'token': token};
    this.authService.signout(t).subscribe((data) => {
      if(data.provider !== "formulario"){
        // No hace el signout porque pasa por el login, revisar esto
        this.signOutGoogle();
      }
      localStorage.clear();
      this.router.navigateByUrl('');
    });
  }

  signOutGoogle(): void {
    this.socialAuth.signOut();
  }
}
