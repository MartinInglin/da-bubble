import { Post } from "./post.class";

export class Thread {
    id: string;
    name: string;
    posts: Post[];

    constructor(obj?: any) {
        this.id = obj?.id || '';
        this.name = obj?.name || '';
        this.posts = obj?.posts?.map((post: any) => new Post(post)) || [];
      }
}