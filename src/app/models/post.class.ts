export class Post {
    id: string;
    message: string;
    timestamp: number;
    reactions: string[];
  
    constructor(obj?: any) {
      this.id = obj?.id || '';
      this.message = obj?.message || '';
      this.timestamp = obj?.timestamp || 0;
      this.reactions = obj?.reactions || [];
    }
  }