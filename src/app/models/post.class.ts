import { Reaction } from "./reaction.class";

export class Post {
  id: string;
  name: string;
  avatar: string;
  message: string;
  timestamp: number;
  reactions: Reaction[];
  edited: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.avatar = obj?.avatar || '';
    this.message = obj?.message || '';
    this.timestamp = obj?.timestamp || 0;
    this.reactions = obj?.reactions?.map((reaction: Reaction) => ({ userName: reaction.userId, userId: reaction.userName , reaction: reaction.reaction })) || [];
    this.edited = obj?.edited || false;
  }
}
