import { MinimalFile } from './minimal_file.class';
import { Reaction } from './reaction.class';

export class Post {
  id: string;
  name: string;
  avatar: string;
  message: string;
  timestamp: number;
  reactions: Reaction[];
  edited: boolean;
  files: MinimalFile[];
  userId: string;
  amountAnswers?: number;
  lastAnswer?: number;
  channelName?: string;
  userName?: string;
  channelId?: string;
  path?: string;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.avatar = obj?.avatar || '';
    this.message = obj?.message || '';
    this.timestamp = obj?.timestamp || 0;
    this.reactions =
      obj?.reactions?.map((reaction: Reaction) => ({
        userName: reaction.userId,
        userId: reaction.userName,
        emoji: reaction.emoji,
      })) || [];
    this.edited = obj?.edited || false;
    this.files =
      obj?.files?.map((file: MinimalFile) => ({
        fileName: obj?.name,
        fileURL: obj?.url,
      })) || [];
    this.userId = obj?.userId || '';
    this.amountAnswers = obj?.amountAnswers || 0;
    this.lastAnswer = obj?.lastAnswer || 0;
    this.channelName = obj?.channelName || '';
    this.userName = obj?.userName || '';   
  }
}
