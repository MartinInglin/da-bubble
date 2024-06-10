
import { MinimalUser } from "../models/minimal_user.class";
import { MinimalChannel } from "./minimal_channel.class";

export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  channels: MinimalChannel[];
  directMessages: any[];
  isGoogleAccount: boolean;
  isSignedIn: boolean;
  isChannel: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.email = obj?.email || '';
    this.avatar = obj?.avatar || '';
    this.channels = obj?.channels?.map((channel: MinimalChannel) => ({ id: channel.id, name: channel.name })) || [];
    this.directMessages = obj?.directMessages?.map((user: User) => ({ id: user.id, avatar: user.avatar })) || [];
    this.isGoogleAccount = obj?.isGoogleAccount || false;
    this.isSignedIn = obj?.isSignedIn || false;
    this.isChannel = obj?.isChannel || false;
  }
}

