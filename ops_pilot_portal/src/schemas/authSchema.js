import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(3,"Password must be at least 3 characters long")
});

export const signupPasswordRules = [
    { label: "At least 8 characters", test: (password) => password.length >= 8 },
    { label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
    { label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
    { label: "One number", test: (password) => /[0-9]/.test(password) },
];

export const signupSchema = z.object({
    fullName: z.string().trim().min(1, "Please enter your full name"),
    email: z.email("Please enter a valid email"),
    password: z.string().superRefine((password, context) => {
        for (const rule of signupPasswordRules) {
            if (!rule.test(password)) {
                context.addIssue({ code: "custom", message: rule.label });
            }
        }
    }),
});