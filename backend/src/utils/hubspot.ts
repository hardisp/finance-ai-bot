import axios from "axios";

export async function createContact(userId: string, { email, firstname, lastname }: any) {
  const accessToken = "USER_HUBSPOT_ACCESS_TOKEN"; // load from DB
  const response = await axios.post(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    { properties: { email, firstname, lastname } },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data;
}
