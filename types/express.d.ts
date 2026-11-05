import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};