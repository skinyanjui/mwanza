import { getDb } from "../../db";
import { notifications } from "../../db/schema";
import { recordId } from "./_shared";

type NotificationInput = {
  recipientEmail?: string | null;
  audience: "customer" | "provider" | "business";
  bookingId?: string | null;
  title: string;
  message: string;
};

export async function createNotification(input: NotificationInput) {
  if (!input.recipientEmail) return;
  try {
    await (await getDb()).insert(notifications).values({
      id: recordId("MN"),
      recipientEmail: input.recipientEmail.toLowerCase(),
      audience: input.audience,
      bookingId: input.bookingId ?? null,
      title: input.title,
      message: input.message,
      status: "Unread",
      createdAt: new Date().toISOString(),
      readAt: null,
    });
  } catch (error) {
    console.error("notification_create_failed", error);
  }
}
