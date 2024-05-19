import { MinimalChannel } from "../interfaces/minimal-channel";

export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  channels: MinimalChannel[];
  directMessages: any[];

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.email = obj?.email || '';
    this.avatar = obj?.avatar || '';
    this.channels = obj?.channels?.map((channel: any) => ({ id: channel.id, name: channel.name })) || [];
    this.directMessages = obj?.directMessages || [];
  }
}
