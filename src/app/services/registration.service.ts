import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private name: string = '';
  private email: string = '';
  private password: string = '';
  private avatar: string = '';

  setName(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  setEmail(email: string) {
    this.email = email;
  }

  getEmail(): string {
    return this.email;
  }

  setPassword(password: string) {
    this.password = password;
  }

  getPassword(): string {
    return this.password;
  }

  setAvatar(avatar: string) {
    this.avatar = avatar;
  }

  getAvatar(): string {
    return this.avatar;
  }

  getUserData() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      avatar: this.avatar,
    };
  }
}

