import { z } from "zod";

// ── Profile Schema ──
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[+\d\s()-]+$/, "Invalid phone format"),
  location: z.string().min(2, "Location is required"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ── User Schema (Admin) ──
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Manager", "Employee", "HR"], {
    message: "Role is required",
  }),
  department: z.string().min(2, "Department is required"),
  phone: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ── Announcement Schema (Admin) ──
export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be under 200 characters"),
  content: z
    .string()
    .min(20, "Content must be at least 20 characters")
    .max(5000, "Content must be under 5000 characters"),
  category: z.enum(["General", "HR", "IT", "Finance", "Safety", "Events"], {
    message: "Category is required",
  }),
  priority: z.enum(["Low", "Medium", "High", "Urgent"], {
    message: "Priority is required",
  }),
});

export type CreateAnnouncementFormValues = z.infer<typeof createAnnouncementSchema>;

// ── Settings Schema ──
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8, "Password must be at least 8 characters"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
