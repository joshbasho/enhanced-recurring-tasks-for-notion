# Enhanced Recurring Tasks for Notion

"Enhanced Recurring Tasks for Notion" is an application designed to offer flexible recurring task management within Notion. Unlike the default recurring tasks in Notion that follow a strict schedule, this application allows tasks to recur based on their completion date. 

For example, let's say you have task on your board for "Clip Dog's Nails" that you want to recur every week. If you were using a Notion's recurring option, you'd have to set it to recur on an exact schedule. For example, you could set it to create a new task every Saturday.

This is mostly fine, but what if you fall behind and end up clipping your dog's nails on Thursday? The task will still be created on Saturday, despite only having clipped your dog's nails a couple days ago. 

With "Enhanced Recurring Tasks for Notion", you can instead set this task to recur based on the completion date. If you fall behind and don't clip your dog's nails until Thursday, the next task for clipping your dog's nails won't be created until the following Thursday. 

## Purpose

This application solves a pretty niche use case. It's best for managing tasks that do not adhere to a strict schedule. I peronsally use it for personal tasks (especially cleaning) where the interval I want it to repeat is more of a goal than a fixed schedule. 

The main impetus behind this is that I don't like tasks cluttering up my board. If there's something I only need to do every two weeks, I want it totally off my radar for the next two weeks, regardless of when I complete it. 

## How It Works

### Setting Up Recurrences
- **Recurring Intervals**: To set a recurring date, simply enter an interval in the "Recurring" property of your task in the format such as "1 week", "2 months", or "3 days". The application calculates the next due date based on this interval from the date the task is marked as completed.
- **Manual Recurrence**: If you want a task to recur only once on a specific date, manually set the "Date Recurring" to your desired date.

### Task Lifecycle
1. **Completion and Recurrence Calculation**: When you complete a task and move it to the "Done" category, an automation automatically sets "Date Completed" to the current date. It then uses this date along with the interval specified in "Recurring" to calculate the next recurrence date.
2. **Archiving and Task Creation**:
    - Non-recurring tasks are moved from "Done" to "Archive".
    - Recurring tasks are moved to "Recurring Archive" where "Date Recurring" is set if not manually specified.
    - It checks the "Recurring Archive" for any task due that day, creates a new task in "New Recurring", and moves the old task to "Archive" to prevent duplication.

## Setup

### Requirements
- A Notion account and API Token.
- Node.js environment to run the script.

### Step-by-Step Setup

1. **Create a Notion Integration**
   - Follow the detailed steps [here](https://developers.notion.com/docs/create-a-notion-integration) to create a Notion integration and obtain an integration token.

2. **Prepare Your Notion Database**
   - Duplicate this template page: [Notion Template](https://rounded-produce-1bd.notion.site/88ae47e9038248f382702508ffb359db?v=8b60d8fb26264332991286dadbb786de).
   - After duplicating, access the page in your browser and get the Database ID from the URL.
   - e.g. https://www.notion.so/88ae47e9038248f382702508ffb359db?v=8b60d8fb26264332991286dadbb786de
   - the Datebase ID in this case is 88ae47e9038248f382702508ffb359db. 

3. **Configure the Application**
   - Clone the repository to your local machine or server.
   - Install dependencies: `npm install`.
   - Copy the `.env.example` file to `.env` and fill in your Notion API token and the Database ID
     
4. **Start Using the Integration!!**
   - To set the interval a task should recur, simply update "Recurring" with the interval (e.g. "1 week", "2 months", "5 days").
   - To set a task to recur a single time, update "Date Recurring" with the date you want it to recur.
   - There's a couple sample tasks with examples.

5. **Run the Application Nightly**
    - Run manually, set up a cron job, or create a lambda function. 
    - Run using `npm start` or `node src/index.mjs`
    - Make sure you are running the application from the root directory or else dotenv won't work correctly.
  
###  **Integrate with Your Existing Task List**
If you prefer to integrate the application with your existing task list, you'll need to make some changes. 
1. Create a Notion Integration as outlined above. 
2. Navigate to your Task List in the browser and get the Database ID from the URL.
3. Copy the `.env.example` file to `.env` and fill in your Notion API token and the database ID
4. In Notion:
   - Rename you property that handles status to "Status".
       - Open any task => Click the property to change => Rename 
   - Add the following options to your Status property: "Archive" and "Recurring Archive" (I personally hide them both) 
       - Open any task => click "Status" => Edit property => Options => "+"
   - Add the following propeties to your database
       - Open any task => Add a property 
       - Type: "Date", Name: "Date Recurring"
       - Type: "Date", Name "Date Completed"
       - Type: "Text", Name: "Recurring"
   - Set up an automation that updates "Date Completed" with the current date and time when a task is moved to your "Done" category.
       - Click ligtening bolt in top right => New automation
       - Add trigger
           - Property edited => Status => Uncheck "Any Option" => Select the option that marks a task as completed
       - Add Action
           - Edit Property => Date Recurring => Now
       - Create  
   - Determine if you are using a type of "status" or "select" for the Status property.
       - Open a task => click "Status" => Edit property => Type => see if it says "select" or "status" 
10. Update variables in `src/libs/config.mjs`.
    - Update `statusProperty` to match your Status property's type ("select" or "status").
    - Update `completedTaskStatus` with the name of the Status option that indicates a task is completed (e.g. "Done"). 
    - Update `recurTaskStatus` with the Status option you would like set when a new recurring task is created (e.g. "Not Started")
11. Follow steps 4 and 5 from "Step by Step Setup". 

### Script Execution
- **Locally**: Run the script as a cron job at your preferred time (e.g., 3:00 AM local time).
- **Serverless**: With adjustments, deploy the script to run as an AWS Lambda function.
    - Mainly just change IIFE to `export const handler = async (event) => { function... }`
    - Trigger lambda with a Cloudwatch Event Rule that runs every night at like 3:00am.
    - Should cost literally nothing to run. 

## Error Handling
When tasks fail to process, the application logs the error details in "New Recurring" for troubleshooting.

## Contributing
Contributions are welcome! Feel free to fork the repository, make improvements, and submit pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
