export class Reaction {
  userName: string;
  userId: string;
  reaction: string;

  constructor(obj?: any) {
    this.userId = obj?.userId || '';
    this.userName = obj?.userName || '';
    this.reaction = obj?.reaction || '';
  }
}
