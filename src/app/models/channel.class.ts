export class Channel {
  id: string;
  users: [];
  posts: [];

  constructor() {
    (this.id = ''), (this.users = []), (this.posts = []);
  }
}
