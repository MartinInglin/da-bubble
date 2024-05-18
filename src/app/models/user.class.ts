export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;

  constructor() {
    (this.id = ''), (this.name = ''), (this.email = '');
    this.avatar = '';
  }
}
