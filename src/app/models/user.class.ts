export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  channels: [];
  directMessages: [];

  constructor(obj?: any) {
    this.id = obj ? obj.id : '',
    this.name = obj ? obj.name : '',
    this.email = obj ? obj.email : '';
    this.avatar = obj ? obj.avatar : '';
    this.channels = obj ? obj.channels : [],
    this.directMessages = obj ? obj.directMessages : []
  }
}
