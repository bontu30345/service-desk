import type { Prisma } from "@prisma/client";

export const safeCommentSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.CommentSelect;

export type SafeComment = Prisma.CommentGetPayload<{
  select: typeof safeCommentSelect;
}>;

export type CommentCreateState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    content?: string[];
  };
};
