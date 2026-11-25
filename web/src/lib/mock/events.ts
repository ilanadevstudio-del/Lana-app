import type { CalendarEvent } from "@/lib/data/types";
import { at } from "./clock";

/** Sample data: two weeks of events around today. */
export function seedEvents(): CalendarEvent[] {
  return [
    // Today
    { id: "e1", calendarId: "cal_focus", title: "Focus: landing page", start: at(0, "09:30"), end: at(0, "11:30"), projectId: "lana-launch", description: "Protected by LANA. Notifications are held until 11:30." },
    { id: "e2", calendarId: "cal_eventfi", title: "EventFi standup", start: at(0, "12:00"), end: at(0, "12:15"), videoUrl: "https://meet.google.com", attendees: ["Tobi", "Ada", "Kemi"], projectId: "eventfi" },
    { id: "e3", calendarId: "cal_work", title: "Product sync with Tobi", start: at(0, "14:30"), end: at(0, "15:00"), videoUrl: "https://meet.google.com", attendees: ["Tobi Adebayo"], projectId: "eventfi", description: "Walk through the check-in flow and decide on the v2 launch date." },
    { id: "e4", calendarId: "cal_eventfi", title: "Partner review prep", start: at(0, "16:00"), end: at(0, "17:00"), location: "Yaba, Lagos", attendees: ["Kemi Bello"], projectId: "eventfi" },
    { id: "e5", calendarId: "cal_personal", title: "Gym", start: at(0, "18:30"), end: at(0, "19:30"), location: "Fitness Hub, Yaba" },

    // Tomorrow
    { id: "e6", calendarId: "cal_focus", title: "Focus: grant application", start: at(1, "09:00"), end: at(1, "11:00"), projectId: "founders-grant" },
    { id: "e7", calendarId: "cal_eventfi", title: "EventFi standup", start: at(1, "12:00"), end: at(1, "12:15"), videoUrl: "https://meet.google.com", projectId: "eventfi" },
    { id: "e8", calendarId: "cal_work", title: "Lunch with Daniel", start: at(1, "13:00"), end: at(1, "14:00"), location: "Café Neo, Lekki" },
    { id: "e9", calendarId: "cal_work", title: "Landing page review", start: at(1, "15:00"), end: at(1, "15:45"), videoUrl: "https://meet.google.com", attendees: ["Ada Nwosu"], projectId: "lana-launch" },

    // Later this week
    { id: "e10", calendarId: "cal_eventfi", title: "Sponsor dashboard review", start: at(2, "16:00"), end: at(2, "17:00"), videoUrl: "https://meet.google.com", attendees: ["Kemi Bello", "Ada Nwosu", "Tobi Adebayo"], projectId: "eventfi" },
    { id: "e11", calendarId: "cal_eventfi", title: "EventFi standup", start: at(2, "12:00"), end: at(2, "12:15"), videoUrl: "https://meet.google.com", projectId: "eventfi" },
    { id: "e12", calendarId: "cal_personal", title: "Flat viewing", start: at(3, "10:00"), end: at(3, "11:00"), location: "Herbert Macaulay Way, Yaba", projectId: "apartment-move" },
    { id: "e13", calendarId: "cal_personal", title: "Call Mum", start: at(3, "18:00"), end: at(3, "18:30") },
    { id: "e14", calendarId: "cal_work", title: "Reference call: Dr. Adeyemi", start: at(3, "15:00"), end: at(3, "15:30"), videoUrl: "https://meet.google.com", projectId: "founders-grant" },
    { id: "e15", calendarId: "cal_personal", title: "Sign the lease", start: at(4, "11:00"), end: at(4, "12:00"), location: "Agent's office, Yaba", projectId: "apartment-move" },
    { id: "e16", calendarId: "cal_eventfi", title: "Lagos Dev Meetup", start: at(5, "17:00"), end: at(5, "20:00"), location: "Co-Creation Hub, Yaba", projectId: "eventfi" },
    { id: "e17", calendarId: "cal_work", title: "Grant submission deadline", start: at(6, "00:00"), end: at(7, "00:00"), allDay: true, projectId: "founders-grant" },

    // Next week
    { id: "e18", calendarId: "cal_eventfi", title: "EventFi retro", start: at(8, "11:00"), end: at(8, "12:00"), videoUrl: "https://meet.google.com", projectId: "eventfi" },
    { id: "e19", calendarId: "cal_work", title: "Investor intro: Zainab", start: at(9, "14:00"), end: at(9, "14:30"), videoUrl: "https://meet.google.com" },
    { id: "e20", calendarId: "cal_personal", title: "Dentist", start: at(10, "09:00"), end: at(10, "10:00"), location: "Smile Clinic, Ikeja" },
    { id: "e21", calendarId: "cal_work", title: "LANA launch", start: at(12, "00:00"), end: at(13, "00:00"), allDay: true, projectId: "lana-launch" },

    // Recent past
    { id: "e22", calendarId: "cal_eventfi", title: "EventFi standup", start: at(-1, "12:00"), end: at(-1, "12:15"), projectId: "eventfi" },
    { id: "e23", calendarId: "cal_work", title: "Design crit with Ada", start: at(-1, "15:00"), end: at(-1, "16:00"), projectId: "lana-launch" },
    { id: "e24", calendarId: "cal_personal", title: "Football", start: at(-2, "17:00"), end: at(-2, "19:00"), location: "Teslim Balogun Stadium" },
    { id: "e25", calendarId: "cal_work", title: "Orbit Pay handover follow-up", start: at(-4, "11:00"), end: at(-4, "11:30"), projectId: "orbit-dashboard" },
  ];
}
