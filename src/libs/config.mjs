import 'dotenv/config'


/**
 * The name of the status that marks a task as completed. This is used in filters and various checks
 * throughout the application to identify completed tasks.
 * Default template uses "Done 🙌"
 */
const completedTaskStatus = "Done 🙌"

/**
 * The type of property that "Status" is. 
 * Will be either "select" or "status"
 * Default template uses "select"
 */

const statusProperty = "select"

/**
 * The value of "Status" set when a recurring task is created. 
 * Default template uses "New Recurring"
 */

const recurTaskStatus = "New Recurring"

/**
 * A list of properties to exclude when copying data from an existing task to create a new recurring task.
 * These properties are typically time-sensitive or specific to a particular instance of a task and should not be duplicated.
 * **IMPORTANT: DO NOT REMOVE the default properties listed. Only add new properties to this list as needed.**
 */
const propertiesToExclude = ['Date Created', 'Date Completed', 'Date Recurring'];

export const config = {
    /**
   * Authentication token for Notion API, stored in environment variables for security.
   */
  authToken: process.env.NOTION_API_TOKEN,
    /**
   * The database ID for tasks within Notion, retrieved from environment variables.
   */
  tasksDb: process.env.TASK_DATABASE_ID,
    /**
   * List of properties to exclude when creating new recurring tasks from existing tasks.
   */
  propertiesToExclude: propertiesToExclude, 
      /**
   * The type of the status property. Either select or status. 
   */
  statusProperty: statusProperty, 
  /**
   * The status value for new recurred tasks.
   */
  recurTaskStatus: recurTaskStatus,
    /**
   * Filter configuration for fetching tasks marked as 'Done'. Uses the `completedTaskStatus` to identify such tasks.
   */
  getDoneTasksFilter: {
    "property": "Status",
    [statusProperty]: {
      "equals": completedTaskStatus
    }
  },
    /**
   * Filter configuration for fetching tasks that are in the 'Recurring Archive'.
   * This is used to identify tasks that are set to recur and need processing to create new instances.
   */
  getRecurringArchivedTasksFilter: {
    property: "Status",
    [statusProperty]: {
      equals: "Recurring Archive"
    }
  }
};