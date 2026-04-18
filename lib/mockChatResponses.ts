export function getMockResponse(input: string): string {
  const text = input.toLowerCase();

  if (/(sarah|daughter)/i.test(text)) {
    return "Sarah is your daughter. She typically visits on Sundays.";
  }

  if (/(doctor|appointment|nair)/i.test(text)) {
    return "Dr. Nair's next appointment is May 3rd at Fortis.";
  }

  if (/(name|who|person)/i.test(text)) {
    return "I can see someone in frame but I need a clearer view to identify them.";
  }

  if (/(time|today|date)/i.test(text)) {
    return `It's ${new Date().toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}.`;
  }

  return "I heard you. Let me think about that for a moment... I'm not sure about that one. Try asking me something else.";
}
