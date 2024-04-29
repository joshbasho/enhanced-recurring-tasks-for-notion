
import { Client } from "@notionhq/client";
import { config } from "./config.mjs";

/**
 * Creates a Notion client instance with the provided authentication token.
 */
const notion = new Client({
  auth: config.authToken
});

/**
 * Updates a page in Notion with new properties.
 * 
 * @param {string} id - The ID of the Notion page to update.
 * @param {Object} properties - An object containing Notion properties to update on the page.
 * @returns {Promise<void>} A promise that resolves with no value upon successful update.
 */
export async function notionPageUpdate(id, properties) {
  return notion.pages.update({
    page_id: id,
    properties: properties
  });
}

/**
 * Queries a Notion database with specified filters.
 * 
 * @param {string} databaseId - The ID of the Notion database to query.
 * @param {Object} filter - An object defining filters to apply to the database query.
 * @returns {Promise<Object>} A promise that resolves with the query results from the Notion database.
 */
export async function notionDatabaseQuery(databaseId, filter) {
  return notion.databases.query({
    database_id: databaseId,
    filter: filter
  });
}

/**
 * Creates a new page in a Notion database.
 * 
 * @param {string} databaseId - The ID of the Notion database where the new page will be created.
 * @param {Object} properties - An object containing properties to set for the new page in the database.
 * @returns {Promise<Object>} A promise that resolves with the details of the newly created page.
 */
export async function notionPageCreate(databaseId, properties) {
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: properties
  });
}

/**
 * Retrieve Database Info
 * 
 * @param {string} databaseId - The ID of the Notion database where the new page will be created.e.
 * @returns {Promise<Object>} A promise that resolves with the details of the newly created page.
 */
export async function notionDatabaseRetrieve(databaseId) {
  return notion.databases.retrieve({
    database_id: databaseId 
  });
}

/**
 * Creates a new page in a Notion database.
 * 
 * @param {string} databaseId - The ID of the Notion database where the new page will be created.
 * @param {Object} properties - An object containing properties to set for the new page in the database.
 * @returns {Promise<Object>} A promise that resolves with the details of the newly created page.
 */
export async function notionDatabaseUpdate(databaseId, properties) {
  return notion.databases.update({
    database_id: databaseId,
    properties: properties
  });
}