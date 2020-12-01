import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
  }

  login(){
    this.router.navigateByUrl('auth/login');
  }

  register(){
    this.router.navigateByUrl('auth/register');
  }

  loginGoogle(){
    this.authService.loginGoogle();
  }
}
