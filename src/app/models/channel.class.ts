import { MinimalUser } from "../interfaces/minimal-user";
import { Post } from "./post.class";

export class Channel {
  id: string;
  name: string;
  users: MinimalUser[];
  posts: Post[];

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || '';
    this.users = obj?.users?.map((user: any) => ({ id: user.id, avatar: user.avatar })) || [];
    this.posts = obj?.posts?.map((post: any) => new Post(post)) || [];
  }
}
