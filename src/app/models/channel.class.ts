import { MinimalUser } from '../interfaces/minimal-user';
import { Post } from './post.class';

export class Channel {
  id: string;
  name: string;
  description: string;
  users: MinimalUser[];
  posts: Post[];

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.description = obj?.description || '';
    this.users =
      obj?.users?.map((user: MinimalUser) => ({ id: user.id, avatar: user.avatar })) ||
      [];
    this.posts = obj?.posts?.map((post: Post) => new Post(post)) || [];
  }
}
