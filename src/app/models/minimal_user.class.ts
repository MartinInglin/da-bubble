export class MinimalUser {
    id: string;
    avatar: string;
    name: string;
    email: string;
  
    constructor(obj?: any) {
      this.id = obj?.id || '';
      this.avatar = obj?.avatar || '';
      this.name = obj?.name || '';
      this.email = obj?.email|| '';
    }
  }
  