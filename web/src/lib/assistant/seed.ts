import type { AssistantState } from "./types";

/** Two past conversations so the list isn't empty while we design. */
export const SEED_STATE: AssistantState = {
  activeId: null,
  conversations: [
    {
      id: "conv_seed_1",
      title: "What's on today?",
      orb: "idle",
      busy: false,
      messages: [
        { id: "m_s1_1", role: "user", parts: [{ type: "text", text: "What do I have scheduled for today?" }] },
        {
          id: "m_s1_2",
          role: "assistant",
          parts: [
            {
              type: "action",
              action: {
                id: "act_s1",
                app: "google-calendar",
                title: "Check today's calendar",
                state: "completed",
                steps: [
                  { id: "s1", label: "Check Google Calendar is connected", state: "done" },
                  { id: "s2", label: "Fetch today's events", state: "done", detail: "2 events" },
                ],
              },
            },
            {
              type: "text",
              text: "You have **2 events** today:\n\n- **2:30 PM:** Product sync with Tobi (video call)\n- **4:00 PM:** EventFi partner review in Yaba\n\nYour morning is free if you want to finish the Lana landing page.",
            },
          ],
        },
      ],
    },
    {
      id: "conv_seed_2",
      title: "Call Mum reminder",
      orb: "idle",
      busy: false,
      messages: [
        { id: "m_s2_1", role: "user", parts: [{ type: "text", text: "Remind me to call Mum every Sunday at 6pm" }] },
        {
          id: "m_s2_2",
          role: "assistant",
          parts: [
            {
              type: "action",
              action: {
                id: "act_s2",
                app: "lana",
                title: "Create a recurring reminder",
                state: "completed",
                steps: [
                  { id: "s1", label: "Work out when", state: "done", detail: "Every Sunday, 6:00 PM" },
                  { id: "s2", label: "Save reminder", state: "done" },
                ],
              },
            },
            { type: "text", text: "Done. I'll remind you to call Mum **every Sunday at 6:00 PM**." },
          ],
        },
      ],
    },
  ],
};
