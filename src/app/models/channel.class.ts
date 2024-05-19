export class Channel {
  id: string;
  name: string;
  users: object[];
  posts: [];

  constructor(obj?:any) {
    this.id = obj ? obj.id : '',
    this.name = obj ? obj.name : '',
    this.users = obj ? obj.channels : [],
    this.posts = obj ? obj.posts : []
  }
}
