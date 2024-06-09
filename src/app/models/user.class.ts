import { MinimalChannel } from "./minimal_channel.class";

export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  channels: MinimalChannel[];
  privateDirectMessageId: string;
  isGoogleAccount: boolean;
  isSignedIn: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.email = obj?.email || '';
    this.avatar = obj?.avatar || '';
    this.channels = obj?.channels?.map((channel: MinimalChannel) => ({ id: channel.id, name: channel.name })) || [];
    this.privateDirectMessageId = obj?.privateDirectMessageId || '';
    this.isGoogleAccount = obj?.isGoogleAccount || false;
    this.isSignedIn = obj?.isSignedIn || false;
  }
}

