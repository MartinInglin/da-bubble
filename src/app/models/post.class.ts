export class Post {
    id: string;
    message: string;
    timestamp: number;
    reactions: [];

    constructor() {
        this.id = '',
        this.message = '',
        this.timestamp = 0,
        this.reactions = []
    }
}