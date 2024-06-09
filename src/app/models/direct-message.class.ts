import { MinimalUser } from './minimal_user.class';
import { Post } from './post.class';

export class DirectMessage {
  id: string;
  users: MinimalUser[];
  posts: Post[];
  isPrivateMessage: boolean;

  constructor(obj?: any) {
    (this.id = obj ? obj.id : ''),
      (this.users =
        obj?.users?.map((user: MinimalUser) => ({
          id: user.id,
          avatar: user.avatar,
        })) || []);
    this.posts = obj?.posts?.map((post: Post) => new Post(post)) || [];
    this.isPrivateMessage = obj?.isPrivateMessage || false;
  }
}
