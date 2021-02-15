const chalk = require('chalk');
const CLI = require('clui');

const { Spinner } = CLI;
const clear = require('clear');
const figlet = require('figlet');
const Configstore = require('configstore');
const fs = require('mz/fs');
const files = require('./lib/file');
const inquirer = require('./lib/xnat-credentials');
const fetchData = require('./utils/fetch_data');

clear();
console.log(
  chalk.yellow(
    figlet.textSync('---------------------', { font: 'big', horizontalLayout: 'full' }),
  ),
);

console.log(
  chalk.yellow(
    figlet.textSync('TRACK-FA-XNAT-CLIENT', { font: 'big', horizontalLayout: 'full' }),
  ),
);
console.log(
  chalk.green('A XNAT Client to upload and download Post-Processed or Processed data for TRACK-FA Project'),
);
console.log(
  chalk.yellow(
    figlet.textSync('---------------------', { font: 'big', horizontalLayout: 'full' }),
  ),
);
console.log(
  chalk.green(
    `Current directory is: ${files.getCurrentDirectoryBase()}`,
  ),
);

async function runProcessedData(processedList, sessionId, host, dryRun) {
  const returnObj = new Map();
  const subjectToCreate = [];
  const expToCreate = [];
  const fileToUpload = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < processedList.length; i++) {
    const file = processedList[i];
    const fileSplitArr = file.split('_');
    const subject = fileSplitArr[1];
    const fileType = fileSplitArr[2];
    // check if subject exist
    const subjectExist = await fetchData.check_subjects(sessionId, host, subject);
    if (subjectExist) {
      console.log(chalk.yellow(`Found subject with id ${subject}`));
    } else {
      // create subject
      subjectToCreate.push(subject);
    }
    // check if experiment exist
    const expExist = await fetchData.check_experiments(sessionId, host, fileType, subject);

    // create experiment
    if (expExist) {
      console.log(chalk.yellow(`Found exp with label ${fileType}`));
    } else if (dryRun) {
      expToCreate.push(fileType);
    } else {
      console.log(chalk.red(`No exp with label ${fileType} found for subject ${subject}`));
      console.log(chalk.green(`Creating exp with label ${fileType} `));
      const expCreated = await fetchData.create_experiment(sessionId, host, fileType, subject, 'ProcessedData');
      if (expCreated) {
        console.log(`Created Processed Data experiment with label ${fileType}`);
      } else {
        // handle this
      }
    }
    // attach resource
    if (dryRun) {
      // check if resource exist
      const resourceExist = await fetchData.get_resource(sessionId, host, fileType, subject);
      if (!resourceExist) {
        fileToUpload.push(file);
      }
    } else {
      // attach resource
      console.log(`uploading file ${file}`);
      const resourceCreated = await fetchData.add_resource(sessionId, host, fileType, subject, '', file);
      console.log(resourceCreated);
    }
  }
  returnObj.set('subject_create', subjectToCreate);
  returnObj.set('exp_create', expToCreate);
  returnObj.set('resource_upload', fileToUpload);
  return returnObj;
}

const run = async () => {
  // check if credentials exist in store
  const conf = new Configstore('credentials');
  let username = conf.get('username');
  let password = conf.get('password');
  let host = conf.get('host');
  if (username && password && host) {
    console.log(
      chalk.yellow(`Found existing XNAT credentials at ${conf.path}`),
    );
  } else {
    const credentials = await inquirer.askXNATCredentials();
    conf.set('host', credentials.host);
    conf.set('username', credentials.username);
    conf.set('password', credentials.password);
    host = conf.get('host');
    username = conf.get('username');
    password = conf.get('password');
  }
  // authenticate user
  const sessionId = await fetchData.authenticate_user(username, password, host);
  if (sessionId) {
    console.log(chalk.green('Authentication OK'));
  } else {
    console.log(chalk.red('Authentication Failed..Please check your credentials'));
  }
  const dataType = await inquirer.askDataType();
  console.log(dataType);
  // get list of project
  const status = new Spinner('Getting XNAT project, please wait...');
  status.start();
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  await sleep(1000);
  const allProjects = await fetchData.get_all_projects(sessionId, host);
  status.stop();
  // prompt user  to select a project
  // eslint-disable-next-line no-unused-vars
  const selectedProject = await inquirer.askProject(allProjects);
  // get list of file to upload
  const fileReadStatus = new Spinner('Reading directory, please wait...');
  fileReadStatus.start();
  await sleep(1000);
  const filteredFileList = [];

  try {
    const fileList = await fs.readdir(files.getCurrentDirectoryBase());
    fileList.forEach((file) => {
      if (file.startsWith('TRACKFA')) {
        filteredFileList.push(file);
      }
    });
  } catch (err) {
    console.error(err);
  }
  // format for file name TRACKFA_UMN001_PREPROC01_QSM.zip
  // iterate and get processed file
  const processedList = [];
  const preProcessedList = [];
  filteredFileList.forEach((file) => {
    const fileSplitArr = file.split('_');
    const fileType = fileSplitArr[2];
    if (fileType.startsWith('PRO')) {
      // add to processed list
      processedList.push(file);
    }
    if (fileType.startsWith('PRE')) {
      // add to pre processed list
      preProcessedList.push(file);
    }
  });
  fileReadStatus.stop();
  // eslint-disable-next-line no-restricted-syntax
  for (const elem of dataType.DataType) {
    if (elem === 'Processed') {
      const ProcessedFileReadStatus = new Spinner('looking for processed data to upload, please wait...');
      ProcessedFileReadStatus.start();
      await sleep(1000);
      // find list of processed data to upload
      ProcessedFileReadStatus.stop();
      const dataObj = await runProcessedData(processedList, sessionId, host, true);
      const subjectToCreate = dataObj.get('subject_create');
      const expToCreate = dataObj.get('exp_create');
      const fileToUpload = dataObj.get('resource_upload');
      console.log(chalk.green(`This run will create following ${subjectToCreate.length} subjects`));
      console.log(chalk.green(`    ${subjectToCreate} `));
      console.log(chalk.green(`This run will create following ${expToCreate.length} experiments`));
      console.log(chalk.green(`    ${expToCreate} `));
      console.log(chalk.green(`This run will upload  following ${fileToUpload.length} files`));
      console.log(chalk.green(`    ${fileToUpload} `));
      // ask user if he wants to continue

      const userResponse = await inquirer.askContinue();
      console.log(userResponse);
      if (userResponse) {
        // upload
        console.log('uploading');
      } else {
        return 0;
      }
    // read all files in a folder
    } else if (elem === 'Pre-Processed') {
      const PreProcessedFileReadStatus = new Spinner('looking for pre-processed data to upload, please wait...');
      PreProcessedFileReadStatus.start();
      await sleep(1000);
      PreProcessedFileReadStatus.stop();
      console.log(preProcessedList);
    } else {
      // raw data

    }
  }
  return 0;
};

run();
