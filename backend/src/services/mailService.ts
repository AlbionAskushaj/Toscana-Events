import { Client } from "postmark";
import { env } from "../config/env";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let client: Client | null = null;

const getClient = () => {
  if (!env.postmarkToken) return null;
  if (!client) {
    client = new Client(env.postmarkToken);
  }
  return client;
};

export const sendEmail = async (payload: EmailPayload) => {
  if (!env.emailFrom || !env.postmarkToken) {
    console.warn("[email] Missing EMAIL_FROM or POSTMARK_SERVER_TOKEN; skipping email");
    return;
  }

  const postmark = getClient();
  if (!postmark) return;

  await postmark.sendEmail({
    From: env.emailFrom,
    To: payload.to,
    Subject: payload.subject,
    HtmlBody: payload.html,
    TextBody: payload.text,
    MessageStream: "outbound",
  });
};
