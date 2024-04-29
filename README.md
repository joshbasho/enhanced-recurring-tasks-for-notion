# Enhanced Recurring Tasks for Notion

"Enhanced Recurring Tasks for Notion" is an application designed to offer flexible recurring task management within Notion. Unlike the default recurring tasks in Notion that follow a strict schedule, this application allows tasks to recur based on their completion date. 

## Purpose

This application is best for managing tasks that do not adhere to a strict schedule. I peronsally use it for personal tasks (especially cleaning) where the interval I want it to repeat is more of a goal than a fixed schedule. 

For example, I try to clip my dog's nails every week, but often fall behind. I'd rather the task recur from the day it was actually completed, rather than piling up unnecessary reminders or duplicates.

## How It Works

### Setting Up Recurrences
- **Recurring Intervals**: To set a recurring date, simply enter an interval in the "Recurring" property of your task in the format such as "1 week", "2 months", or "3 days". The application calculates the next due date based on this interval from the date the task is marked as completed.
- **Manual Recurrence**: If you want a task to recur only once on a specific date, manually set the "Date Recurring" to your desired date.

### Task Lifecycle
1. **Completion and Recurrence Calculation**: When you complete a task and move it to the "Done" category, an automation automatically sets "Date Completed" to the current date. It then uses this date along with the interval specified in "Recurring" to calculate the next recurrence date.
2. **Archiving and Task Creation**:
    - Non-recurring tasks are moved from "Done" to "Archive".
    - Recurring tasks are moved to "Recurring Archive" where "Date Recurring" is set if not manually specified.
    - On the day a task is set to recur, it checks the "Recurring Archive" for any task due that day, creates a new task in "New Recurring", and moves the old task to "Archive" to prevent duplication.

## Setup

### Requirements
- A Notion account and API Token.
- Node.js environment to run the script.

### Step-by-Step Setup

1. **Create a Notion Integration**
   - Follow the detailed steps [here](https://developers.notion.com/docs/create-a-notion-integration) to create a Notion integration and obtain an integration token.

2. **Prepare Your Notion Database**
   - Duplicate this template page: [Notion Template](https://rounded-produce-1bd.notion.site/88ae47e9038248f382702508ffb359db?v=8b60d8fb26264332991286dadbb786de).
   - After duplicating, access the page in your browser Database ID from the URL. 

    - **Integrate with Your Existing Task List**
       If you prefer to integrate the application with your existing task list, follow these steps:
       1. In your "Status" property, add the following options: "New Recurring", "Archive", "Recurring Archive" (I personally hide "Archive" and "Recurring Archive")
       2. Add the following date properties to your database: "Date Recurring" and "Date Completed".
       3. Set up an automation in Notion that updates "Date Completed" with the current date and time when a task is moved to your "Done" category.
       4. Modify the `completedTaskStatus` and `statusProperty` in `/libs/config.mjs` to match your database's setup.

3. **Configure the Application**
   - Clone the repository to your local machine or server.
   - Install dependencies: `npm install`.
   - Copy the `.env.example` file to `.env` and fill in your Notion API token and the database ID.

### Script Execution
- **Locally**: Run the script as a cron job at your preferred time (e.g., 3:00 AM local time).
- **Serverless**: With adjustments, deploy the script to run as a Lambda function.

## Error Handling
When tasks fail to process, the application logs the error details in "New Recurring" for troubleshooting.

## Contributing
Contributions are welcome! Feel free to fork the repository, make improvements, and submit pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
