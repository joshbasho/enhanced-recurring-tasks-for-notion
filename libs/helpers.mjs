import { notionPageCreate, notionDatabaseQuery } from "./notion.mjs";
import { config } from "../config.mjs";
/**
 * Delays the execution for a specified amount of milliseconds.
 * @param {number} ms - The amount of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs an error and rethrows it to be handled by the caller.
 * @param {string} context - Description of where the error occurred.
 * @param {Error} error - The caught error object.
 * @throws {Error} - Rethrows the error for further handling.
 */
export function errorHandler(context, error) {
  throw error; // Rethrow the error after logging.
}

/**
 * Logs task activity for better traceability.
 * @param {string} taskId - The ID of the task being logged.
 * @param {string} action - The action taken on the task (e.g., 'archived', 'created').
 */
export function logTaskActivity(taskId, action) {
    console.log(`Task ${taskId} successfully ${action}.`);
}

/**
 * Creates a summary of the results from processing tasks. This function compiles statistics and outcomes from various task operations
 * into a single summary object, which can be used for reporting, logging, or further analysis.
 * @param {Object} doneTasks - An object containing statistics and details about tasks that have been processed and possibly archived.
 * @param {Object} tasksToRecur - An object containing statistics and details about tasks that were checked for recurrence and processed accordingly.
 * @returns {Object} An object containing detailed summaries of the tasks processed, including counts of tasks completed, archived, failed, and recurred.
 */
export function createSummary(doneTasks, tasksToRecur) {
  return {
    totalCompletedTasks: doneTasks.totalCompletedTasks,
    recurringTasksProcessed: doneTasks.recurringTasksCompleted - doneTasks.recurringParseFailures, 
    recurringParseFailures: doneTasks.recurringParseFailures,
    archivedTasks: doneTasks.archivedTasks + tasksToRecur.archivedTasks,
    archiveFailures: doneTasks.archiveFailures + tasksToRecur.archiveFailures,
    recurredTasks: tasksToRecur.recurredTasks,
    recurCreationFailures: tasksToRecur.recurCreationFailures,
    message: (doneTasks.totalCompletedTasks > 0 ? "Archived and processed completed tasks." : "No completed tasks to archive.") + (tasksToRecur.recurredTasks > 0 ? ` Created and archived recurring tasks.` : " No new recurring tasks created.")
  };
}

/**
 * Custom error class for handling exceptions with additional metadata specific to page operations.
 * 
 * @class
 * @extends Error
 * @param {string} message - Descriptive message associated with the error.
 * @param {string} pageId - The ID of the Notion page related to the error.
 * @param {string} name - A name for the type of error, typically used to identify the kind of operation that failed.
 * @param {Error} originalError - The original error that was caught, providing context or stack trace for deeper debugging.
 */
export class errorPageId extends Error {
  constructor(message, pageId, name, originalError) {
    super(message);
    this.pageId = pageId;
    this.name = name;
    this.originalError = originalError
  }
}


/**
 * Creates a new Notion page to log an error about an invalid recurring date format for a task.
 * @param {string} taskId - The ID of the task with the invalid date format.
 * @param {string} taskName - The name of the task with the invalid date format.
 * @param {string} errorType - The type of error being logged 
 * @returns {Promise<void>} A promise that resolves when the error card has been successfully created.
 */
export async function createErrorCard(taskId, taskName, errorType) {
  try {
    let name;

    if (errorType === "InvalidRecurring") name = `Recurring format is invalid for task ${taskId} with name ${taskName}.`    
    if (errorType === "RecurCreationFail") name = `Failed to create recurring task for task ${taskId} with name ${taskName}.`
    if (errorType === "ArchiveFailed") name = `Failed to archive task ${taskId} with name ${taskName}.`

    let properties = { 
      Name: { title: [ { text: { content : name } } ] }, 
      Status: { [config.statusProperty] : { name : config.recurTaskStatus } }
      }

    const filter = {
      "and": [
        {
          property: "Name",
          title: {
            equals: name
          }
        }
      ]
    };

    let existingPage = await notionDatabaseQuery(config.tasksDb, filter)
    existingPage.results.length === 0 ? await notionPageCreate(config.tasksDb, properties) : console.log(`Error card already created for ${taskId}`)

  } catch(error) {
    console.error(`Failed to create Error Page for ${taskId}} with name ${taskName}`, error)
  }
}
