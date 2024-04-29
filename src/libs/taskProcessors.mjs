
import { parseISO, add, format } from 'date-fns';
import {notionPageUpdate, notionPageCreate} from './notion.mjs';
import {errorHandler, logTaskActivity, delay, errorPageId, createErrorCard} from './helpers.mjs';
import { config } from './config.mjs';
const tasksDb = config.tasksDb;


/**
 * Processes task data retrieved from Notion and structures it appropriately. This includes extracting relevant properties
 * and preparing them for further processing such as archiving or updating.
 * @param {Object} tasks - The tasks object returned from Notion containing an array of task details.
 * @returns {Array<Object>} An array of processed tasks with key details extracted for further operations.
 */
export function processTasks(tasks) {
  try {
    return tasks.results.map(task => ({
      name: task.properties.Name.title[0]?.text.content,
      page_id: task.id,
      recurring: task.properties.Recurring.rich_text[0]?.text.content,
      date_recurring: task.properties['Date Recurring'].date?.start,
      date_completed: task.properties['Date Completed'].date.start,
      properties: task.properties,
    }));
  } catch (error) {
    errorHandler('Processing tasks', error);
  }
}

/**
 * Archives tasks based on their current status, selectively excluding specified tasks, while respecting API rate limits
 * through deliberate delays. Also determines if tasks should be archived normally or as part of a recurring process.
 * @param {Array<Object>} tasks - Array of task objects to be archived.
 * @param {boolean} recur - Indicates if tasks with task.recurring or task.date_recurring should be moved to "Recurring Archive" or "Archive". True for "Recurring Archive"
 * @param {Array<string>} [excludeList=[]] - List of task page IDs to exclude from archiving.
 * @returns {Promise<Object>} A promise that resolves to an object containing counts of successfully archived tasks and failures.
 */
export async function archiveTasks(tasks, recur, excludeList = []) {
  // Filter out tasks that are in the excludeList
  const tasksToArchive = tasks.filter(task => !excludeList.includes(task.page_id));
  const archivePromises = tasksToArchive.map(async task => {
    try {
      const status = recur ? (task.recurring || task.date_recurring ? "Recurring Archive" : "Archive") : "Archive";
      const properties = { "Status": { [config.statusProperty]: { name: status } } };
      await notionPageUpdate(task.page_id, properties);
      await delay(334);
      logTaskActivity(task.page_id, 'archived');
      return { success: true, page_id: task.page_id, message: `${task.page_id} archived` };
    } catch (error) {
        await createErrorCard(task.page_id, task.name, 'ArchiveFailed');
        throw new errorPageId(`Failed to archive ${task.page_id}.`, task.page_id, 'ArchiveFailed', error);
    }
  });

  const results = await Promise.allSettled(archivePromises);
  // Process results and log accordingly
  results.forEach(result => {
    if (result.status === 'rejected') {
        console.error(result.reason);
    }
  });

  let successfulArchives = results.filter(result => result.status === 'fulfilled')
  let failedArchives = results.filter(result => result.status === 'rejected')

  return {archivedTasks: successfulArchives.length > 0 ? successfulArchives.length : 0, failedToArchive: failedArchives.length > 0 ? failedArchives.length : 0}

}

/**
 * Sets or updates the recurring date for specified tasks based on their designated recurrence patterns. Handles tasks
 * independently to ensure non-blocking operations and allows for continuation even if some tasks encounter errors.
 * @param {Array<Object>} recurringTasks - An array of task objects for which recurring dates need to be set or updated.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of results, each representing the outcome of the update operation for a task.
 */

export async function setDateRecurring(recurringTasks) {
  const recurringRegex = /^(\d+) (\w+)/;
  const unitMapping = { 'week': 'weeks', 'day': 'days', 'month': 'months', 'year': 'years' };
  const acceptableUnits = ['weeks', 'days', 'months', 'years'];

  // Use Promise.allSettled to handle each task independently
  const recurringTasksPromises = recurringTasks.map(async task => {
    if (!task.date_recurring) {
      const completedDate = parseISO(task.date_completed);
      const parsedRecurring = task.recurring.match(recurringRegex);

      if (!parsedRecurring || !acceptableUnits.includes(unitMapping[parsedRecurring[2].toLowerCase()])) {
        await createErrorCard(task.page_id, task.name, 'InvalidRecurring');
        throw new errorPageId(`Recurring format is invalid for task ${task.page_id}.`, task.page_id, 'InvalidRecurring');
        }

      const unit = unitMapping[parsedRecurring[2].toLowerCase()];
      const value = parseInt(parsedRecurring[1], 10);
      const dateRecurring = format(add(completedDate, { [unit]: value }), "yyyy-MM-dd");

      const properties = { "Date Recurring": { type: "date", date: { start: dateRecurring } } };
      await notionPageUpdate(task.page_id, properties);
      await delay(334);
      logTaskActivity(task.page_id, 'date recurring set');
      return { success: true, page_id: task.page_id, message: `Recurring Date Updated for ${task.page_id}` };
    } else {
      return { success: true, page_id: task.page_id, message: `No update required for ${task.page_id}, date recurring already set` };
    }
  });

  const results = await Promise.allSettled(recurringTasksPromises)

  // Process results and log accordingly
  results.forEach(result => {
      if (result.status === 'rejected') {
          console.error(result.reason);
      }
  });

  return results;
}


/**
 * Creates new recurring tasks based on previously archived tasks. This involves copying relevant properties
 * from old tasks to new tasks while ensuring properties that should not be copied are excluded.
 * @param {Array<Object>} tasks - The tasks to recreate as new recurring tasks.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects, each representing the outcome of the task creation process.
 */

export async function createRecurringTasks(tasks) {

  // Map each task to a promise and handle them individually
  const taskPromises = tasks.map(async task => {
    try {
      const propertiesToDelete = config.propertiesToExclude
      // Prepare properties for the new task
      const newProperties = { ...task.properties, Status: { [config.statusProperty]: { name: config.recurTaskStatus } } };
      propertiesToDelete.forEach(prop => delete newProperties[prop]);

      // Create the new recurring task in Notion
      let result = await notionPageCreate(tasksDb, newProperties);
      logTaskActivity(result.id, "created");
      await delay(334);
      return { success: true, oldPageId: task.page_id, newPageId: result.id, message: `Recurring Task Created for ${task.page_id}` };
    } catch (error) {
        await createErrorCard(task.page_id, task.name, 'RecurCreationFail');
        throw new errorPageId(`Failed to create recurring task for ${task.page_id}.`, task.page_id, 'RecurCreationFail', error);
    }
  });

  // Use Promise.allSettled to handle the results of all task creation promises
  const results = await Promise.allSettled(taskPromises);

  // Process results to log them appropriately
  results.forEach(result => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });

  return results;
}

/**
 * Filters out tasks that have failed certain operations, based on their status and specific conditions.
 * Primarily used to exclude tasks from subsequent steps if they have failed previous steps.
 * @param {Array<Object>} failedResults - Array of results from prior operations, potentially containing failed entries.
 * @returns {Array<string>} An array of page IDs that represent the tasks that have failed and should be excluded.
 */
export function excludeFailedResults(failedResults) {
  return failedResults 
    .filter(result => result.status === 'rejected')
    .map(result => result.reason.pageId);
}