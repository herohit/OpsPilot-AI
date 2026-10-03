import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(3,"Password must be at least 3 characters long")
});