import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private name: string = '';
  private email: string = '';
  private password: string = '';
  private avatar: string = '';
  private avatarFile: File = new File([], "empty.txt");

  /**
   * This function sets the name of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @param name string
   */
  setName(name: string) {
    this.name = name;
  }

  /**
   * This function gets the name of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @returns name as string
   */
  getName(): string {
    return this.name;
  }

  /**
   * This function sets the email of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @param email string
   */
  setEmail(email: string) {
    this.email = email;
  }

  /**
   * This function gets the name of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @returns email as string
   */
  getEmail(): string {
    return this.email;
  }

  /**
   * This function sets the password of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @param password string
   */
  setPassword(password: string) {
    this.password = password;
  }

  /**
   * This function gets the password of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @returns password as string
   */
  getPassword(): string {
    return this.password;
  }

  /**
   * This function sets the URL of the avatar of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @param avatar URL of avatar image
   */
  setAvatar(avatar: string) {
    this.avatar = avatar;
  }

  /**
   * This function gets the URL of the avatar of the user. It is needed to store the name in case the user moves back and forward between registration and choose avatar page.
   * 
   * @returns URL of avatar image.
   */
  getAvatar(): string {
    return this.avatar;
  }

  setAvatarFile(file: File) {
    this.avatarFile = file;
  }

  getAvatarFile(): File {
    return this.avatarFile;
  }

    /**
   * This function gets an object of the user data.
   * 
   * @returns Obeject of user data
   */
  getUserData() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      avatar: this.avatar,
      avatarFile: this.avatarFile,
    };
  }
}

