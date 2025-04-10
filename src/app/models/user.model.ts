export interface User {
    id?: number;
    username: string;
    email: string;
    password?: string;
    role?: {
      id: number;
    };
  }
  
  export interface Role {
    id: number;
    name: string;
    description: string;
  }