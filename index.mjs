import { archiveTasks, processTasks, setDateRecurring, createRecurringTasks, excludeFailedResults } from './libs/taskProcessors.mjs'
import { createSummary, errorHandler } from './libs/helpers.mjs'
import { notionDatabaseQuery } from './libs/notion.mjs';
import { config } from './config.mjs';

/**
 * Processes tasks marked as done by querying the Notion database. This involves setting dates for recurring tasks,
 * archiving completed tasks, and collecting statistics about these processes.
 *
 * @returns {Promise<Object>} A promise that resolves to an object containing statistics about the processing, including totals for
 * completed tasks, archived tasks, and any failures in parsing or archiving.
 */
async function processDoneTasks() {

  let stats = {
    totalCompletedTasks: 0, 
    recurringTasksCompleted: 0, 
    archivedTasks: 0, 
    archiveFailures: 0, 
    recurringParseFailures: 0 
  }

  try {

  const doneTasks = await notionDatabaseQuery(config.tasksDb, config.getDoneTasksFilter);

  if (doneTasks.results.length === 0) {
    console.log("No completed tasks to process!");
    return stats
  }

    const processedTasks = processTasks(doneTasks);
    const recurringTasks = processedTasks.filter(task => task.recurring || task.date_recurring);
    const recurringResults = await setDateRecurring(recurringTasks);
    const excludeRejectedList = excludeFailedResults(recurringResults)

    let archiveStats = await archiveTasks(processedTasks, true, excludeRejectedList);

    stats = {
      totalCompletedTasks: processTasks.length,
      recurringTasksCompleted: recurringTasks.length, 
      archivedTasks: archiveStats.archivedTasks, 
      archiveFailures: archiveStats.failedToArchive, 
      recurringParseFailures: excludeRejectedList.length
    }

    return stats

  } catch (error) {
    errorHandler('Process completed tasks', error);
  }
}

/**
 * Handles tasks marked for recurrence by querying the Notion database for tasks in the recurring archive,
 * creating new recurring tasks based on the original archived tasks, and archiving the original tasks if necessary.
 * Also collects statistics about the handling of these recurring tasks.
 *
 * @returns {Promise<Object>} A promise that resolves to an object detailing the results of handling recurring tasks,
 * including the counts of tasks recurred and any failures in creating new tasks or archiving.
 */
async function handleRecurringTasks() {

  let stats = {
    recurredTasks: 0,
    recurCreationFailures: 0, 
    archivedTasks: 0, 
    archiveFailures: 0
  }

  try {
    const recurringArchivedTasks = await notionDatabaseQuery(config.tasksDb, config.getRecurringArchivedTasksFilter)
    
    if (recurringArchivedTasks.results.length === 0) {
      console.log("No tasks in Recurring Archive!");
      return stats
    }

    const processedArchivedTasks = processTasks(recurringArchivedTasks);
    const tasksToRecur = processedArchivedTasks.filter(task => new Date() >= new Date(`${task.date_recurring}T00:00`));

    if (tasksToRecur.length === 0) {
      console.log("No tasks to recur!");
      return stats
    }

    const creationResults = await createRecurringTasks(tasksToRecur);
    const excludeRejectedList = excludeFailedResults(creationResults)
    const archiveStats = await archiveTasks(tasksToRecur, false, excludeRejectedList);

    stats = {
      recurredTasks: tasksToRecur.length,
      recurCreationFailures: excludeRejectedList.length,
      archivedTasks: archiveStats.archivedTasks,
      archiveFailures: archiveStats.failedToArchive
    };

    return stats

  } catch (error) {
    errorHandler('Handle recurring tasks', error);
  }
}

// Self-invoking async function to run the operations
( async () => {
  try {

    const processedTaskStats = await processDoneTasks();
    const tasksToRecurStats = await handleRecurringTasks();
    const summary = createSummary(processedTaskStats, tasksToRecurStats);
    
    console.log("Operation completed", summary);

  } catch (error) {
    console.error("A critical error occurred: ", error);
  }
})();