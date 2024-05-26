export class MinimalChannel {
    name: string;
    id: string
  
    constructor(obj?: any) {
      this.name = obj?.name || '';
      this.id = obj?.id || '';
    }
  }