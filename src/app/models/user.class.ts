import { MinimalChannel } from "../interfaces/minimal-channel";
import { MinimalUser } from "../interfaces/minimal-user";

export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  channels: MinimalChannel[];
  directMessages: MinimalUser[];

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.email = obj?.email || '';
    this.avatar = obj?.avatar || '';
    this.channels = obj?.channels?.map((channel: any) => ({ id: channel.id, name: channel.name })) || [];
    this.directMessages = obj?.directMessages?.map((user: any) => ({ id: user.id, avatar: user.avatar })) || [];
  }
}

