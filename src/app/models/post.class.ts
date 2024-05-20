export class Post {
    id: string;
    name: string;
    avatar: string;
    message: string;
    timestamp: number;
    reactions: string[];
  
    constructor(obj?: any) {
      this.id = obj?.id || '';
      this.name = obj?.name || '';
      this.avatar = obj?.avatar || '';
      this.message = obj?.message || '';
      this.timestamp = obj?.timestamp || 0;
      this.reactions = obj?.reactions || [];
    }
  }