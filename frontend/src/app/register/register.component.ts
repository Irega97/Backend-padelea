import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// MODELS
import { Token } from './../models/token';

// SERVICES
import { AuthService } from './../services/auth.service';

// FORMULARIO REACTIVO
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// oAUTH
import { SocialAuthService } from 'angularx-social-login';
import { FacebookLoginProvider, GoogleLoginProvider } from "angularx-social-login";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  isSubmitted = false;
  user;

  constructor(public authService: AuthService, private router: Router, 
              private formBuilder: FormBuilder, private socialAuth: SocialAuthService) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.nullValidator]],
      username: ['', [Validators.required, Validators.nullValidator]],
      email: ['', [Validators.required, Validators.nullValidator, Validators.email]],
      password: ['', [Validators.required, Validators.nullValidator]],
      confirmPassword: ['', [Validators.required, Validators.nullValidator]]
    }, {validator: this.checkPasswords });
  }
  get formControls(){
    return this.registerForm.controls;
  }

  checkPasswords(group: FormGroup) { // here we have the 'passwords' group
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPassword').value;

    return pass === confirmPass ? null : { notSame: true };
  }

  submitRegister(): void {
    this.isSubmitted = true;
    if(this.registerForm.invalid){
      return;
    }
    const username = this.registerForm.value.username;
    const name = this.registerForm.value.name;
    const email = this.registerForm.value.email;
    const password = this.registerForm.value.password;
    const provider = "formulario";
    let pass;
    pass = this.authService.encryptPassword(password);
    const user = {'name': name, 'username': username, 'email': email, 'password': pass, 'provider': provider};
    this.authService.register(user)
    .subscribe((jwt: Token) => {
      localStorage.setItem('ACCESS_TOKEN', jwt.token);
      this.router.navigateByUrl('/home');
    });
  }

  async registerGoogle(){
    await this.socialAuth.signIn(GoogleLoginProvider.PROVIDER_ID);
    await this.socialAuth.authState.subscribe((user) => {
      console.log("GOOGLE PROFILE: ", user);
      this.user = { "name": user.name, "email": user.email, "image" : user.photoUrl, "provider": user.provider };
    });
    this.authService.register(this.user).subscribe((jwt: Token) => {
      localStorage.setItem('ACCESS_TOKEN', jwt.token);
      this.router.navigateByUrl('/setusername');
    });
  }

  async registerFacebook() {}

  async registerTwitter() {}

}
