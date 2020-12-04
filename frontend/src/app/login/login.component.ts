import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

//MODELS
import { Token } from '../models/token';

// SERVICES
import { AuthService } from './../services/auth.service';

//oAUTH
import { SocialAuthService } from 'angularx-social-login';
import { FacebookLoginProvider, GoogleLoginProvider } from "angularx-social-login";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  isSubmitted = false;
  user;

  constructor(public authService: AuthService, private router: Router, 
              private formBuilder: FormBuilder, private socialAuth: SocialAuthService) { }

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
    const user = {'name': name, 'password': this.authService.encryptPassword(password)};
    this.authService.login(user)
    .subscribe((jwt: Token) => {
      localStorage.setItem('ACCESS_TOKEN', jwt.token);
      this.router.navigateByUrl('/home');
    });
  }

  async loginGoogle(){
    await this.socialAuth.signIn(GoogleLoginProvider.PROVIDER_ID);
    await this.socialAuth.authState.subscribe((user) => {
      console.log("GOOGLE PROFILE: ", user);
      this.user = { "email": user.email, "provider": user.provider };
    });
    this.authService.login(this.user).subscribe((jwt: Token) => {
      localStorage.setItem('ACCESS_TOKEN', jwt.token);
      this.router.navigateByUrl('/home');
    });
  }

  async loginFacebook(){}

  async loginTwitter(){}

}
