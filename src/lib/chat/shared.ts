/** Shared by the chat API and the chat window. */

/** What the assistant writes on its own line when a person should take over. The chat window turns it into contact buttons. */
export const HANDOFF = "[[handoff]]";

export const CONTACT_EMAIL = "hello@njia.co.ke";

/** Longest question a visitor can send. */
export const MAX_QUESTION_LENGTH = 600;

/** How many recent messages are sent with each question. */
export const MAX_HISTORY = 12;

/** Earlier answers are cut to this length when sent back as history, so a long answer never blocks the next question. */
export const MAX_REPLY_HISTORY = 4000;
