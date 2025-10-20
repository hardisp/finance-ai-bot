import * as hubspot from "../utils/hubspot.js";
import * as email from "../utils/email.js";
import * as calendar from "../utils/calendar.js";
import { prisma } from "../../prisma/client.js";

export async function handleToolAction(userId: string, action: any) {
  const { tool, params } = action;

  switch (tool) {
    case "createHubspotContact":
      return await hubspot.createContact(userId, params);

    case "sendEmail":
      return await email.send(userId, params);

    case "createCalendarEvent":
      return await calendar.createEvent(userId, params);

    case "addTask":
      return await prisma.task.create({
        data: {
          userId,
          description: params.description,
          status: params.status || "pending",
        },
      });

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
