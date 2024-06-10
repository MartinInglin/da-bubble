import { MinimalUser } from '../models/minimal_user.class';
import { Post } from './post.class';

export class Channel   {
  id: string;
  name: string;
  description: string;
  users: MinimalUser[];
  posts: Post[];
  isDirectMessage: boolean;
  isChannel: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.description = obj?.description || '';
    this.users = obj?.users?.map((user: MinimalUser) => new MinimalUser(user)) || [new MinimalUser()];
    this.posts = obj?.posts?.map((post: Post) => new Post(post)) || [new Post()];
    this.isDirectMessage = obj?.isDirectMessage || false;
    this.isChannel = obj?.isChannel 
  }
}

