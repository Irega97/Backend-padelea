import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from './../services/user.service';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-username',
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.css']
})
export class UsernameComponent implements OnInit {

  usernameForm: FormGroup;
  isSubmitted = false;

  constructor(private formBuilder: FormBuilder, private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    this.usernameForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.nullValidator]]
    });
  }
  get formControls(){
    return this.usernameForm.controls;
  }

  submitUsername() {
    const username = this.usernameForm.value.username;
    this.userService.changeUsername(username).subscribe(() => {
      this.router.navigateByUrl('/home');
    });
  }
}
