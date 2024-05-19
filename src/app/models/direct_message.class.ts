export class DirectMessage {
    id: string;
    users: [];
    posts: [];
  
    constructor(obj?:any) {
      this.id = obj ? obj.id : '',
      this.users = obj ? obj.channels : [],
      this.posts = obj ? obj.posts : []
    }
  }