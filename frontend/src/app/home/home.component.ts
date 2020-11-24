import { Router } from '@angular/router';
import { environment } from './../../environments/environment';
import { AuthService } from './../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(public authService: AuthService, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
  }

  signout(){
    let token = localStorage.getItem('token');
    const t = {"token": token};
    this.http.put(environment.apiURL + '/auth/signout', t).subscribe(() => {
      localStorage.clear();
      this.router.navigateByUrl('');
    })
  }

}
