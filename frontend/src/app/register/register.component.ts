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
      city: ['', [Validators.required, Validators.nullValidator]],
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
    const name = this.registerForm.value.name;
    const sex = this.registerForm.value.sex;
    const city = this.registerForm.value.city;
    const email = this.registerForm.value.email;
    const password = this.registerForm.value.password;
    let pass;
    pass = this.auth.encryptPassword(password);
    const user = {'name': name, 'sex': sex, 'city': city, 'email': email, 'password': pass};
    this.auth.register(user)
    .subscribe((jwt: Token) => {
      localStorage.setItem('token', jwt.token);
      this.router.navigateByUrl('/home');
    });
  }
}
