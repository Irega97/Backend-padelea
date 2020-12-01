import { environment } from './../../environments/environment';
import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Token } from '../models/token';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  isSubmitted = false;

  constructor(public auth: AuthService, private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.nullValidator]],
      password: ['', [Validators.required, Validators.nullValidator]]
    });
  }
  get formControls(){
    return this.loginForm.controls;
  }

  submitLogin(): void{
    this.isSubmitted = true;
    if(this.loginForm.invalid){
      return;
    }
    const name = this.loginForm.value.name;
    const password = this.loginForm.value.password;
    const user = {'name': name, 'password': this.auth.encryptPassword(password)};
    console.log(user);
    this.auth.login(user)
    .subscribe((jwt: Token) => {
      localStorage.setItem('ACCESS_TOKEN', jwt.token);
      this.router.navigateByUrl('/home');
    });
  }

}
