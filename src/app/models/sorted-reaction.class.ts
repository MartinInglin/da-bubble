export class SortedReaction {
    userName: string[];
    userId: string[];
    emoji: string;
  
    constructor(obj?: any) {
      this.userId = [obj?.userId] || [];
      this.userName = [obj?.userName] || [];
      this.emoji = obj?.emoji || '';
    }
  }