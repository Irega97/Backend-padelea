import { Token } from './../models/token';
import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  isSubmitted = false;

  constructor(public auth: AuthService, private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.nullValidator]],
      sex: ['', [Validators.required, Validators.nullValidator]],
      email: ['', [Validators.required, Validators.nullValidator]],
      password: ['', [Validators.required, Validators.nullValidator]]
    });
  }
  get formControls(){
    return this.registerForm.controls;
  }


  submitRegister(): void {
    this.isSubmitted = true;
    if(this.registerForm.invalid){
      return;
    }
    const name = this.registerForm.value.name;
    const sex = this.registerForm.value.sex;
    const email = this.registerForm.value.email;
    const password = this.registerForm.value.password;
    const user = {'name': name, 'sex': sex, 'image': 'default image', 'email': email, 'password': password};
    this.auth.register(user)
    .subscribe((jwt: Token) => {
      localStorage.setItem('token', jwt.token);
      this.router.navigateByUrl('/home');
    })
  }
}
