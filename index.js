const chalk = require('chalk');
const CLI = require('clui');

const { Spinner } = CLI;
const clear = require('clear');
const figlet = require('figlet');
const Configstore = require('configstore');
const fs = require('mz/fs');
const AdmZip = require('adm-zip');
const yargs = require('yargs');
const files = require('./lib/file');
const inquirer = require('./lib/xnat-credentials');
const fetchData = require('./utils/fetch_data');
const utils = require('./utils/utils');
const processedFiles = require('./utils/process_upload');

const conf = new Configstore('credentials');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getDataType(mode, options) {
  let dataType = {};
  if (mode === 'interactive') {
    if (!conf.get('data_type')) {
      dataType = await inquirer.askDataType('upload');
    } else {
      dataType.DataType = conf.get('data_type');
    }
  }
  if (mode === 'non-interactive') {
    dataType.DataType = options.data_type;
  }
  return dataType;
}

async function getProject(mode, options, sessionId, host) {
  let selectedProject = {};
  if (mode === 'interactive') {
    if (!conf.get('project')) {
      const status = new Spinner('Getting XNAT project, please wait...');
      status.start();
      await sleep(1000);
      const allProjects = await fetchData.get_all_projects(sessionId, host);
      status.stop();
      // prompt user  to select a project
      // eslint-disable-next-line no-unused-vars
      selectedProject = await inquirer.askProject(allProjects);
    } else {
      selectedProject.project = conf.get('project');
    }
  }
  if (mode === 'non-interactive') {
    selectedProject.project = options.project;
  }
  return selectedProject;
}

async function downloadFiles(selectedFiles, sessionId, host) {
  // eslint-disable-next-line no-restricted-syntax
  for (const file of selectedFiles.files) {
    // list resources
    // eslint-disable-next-line no-unused-vars
    const downloadFileStatus = new Spinner(`Downloading file ${file}, please wait...\n`);
    downloadFileStatus.start();
    // eslint-disable-next-line no-unused-vars
    const rsStatus = await fetchData.download_file(sessionId, host, file).then(() => {
      downloadFileStatus.stop();
    });
  }
}

// eslint-disable-next-line no-unused-vars
const run = async (options) => {
  const mode = options._[0] === 'i' ? 'interactive' : 'non-interactive';
  // check if credentials exist in store
  let host; let username; let password;
  if (mode === 'interactive') {
    username = conf.get('username');
    password = conf.get('password');
    host = conf.get('host');
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
  }
  if (mode === 'non-interactive') {
    username = options.username;
    password = options.password;
    host = options.host;
  }
  // authenticate user
  const response = await fetchData.authenticate_user(username, password, host);
  let sessionId = null;
  if (response.ok) {
    // get sessionID
    sessionId = await response.text();
  } else {
    console.log(chalk.red('Authentication Failed..Please check your credentials'));
    return process.exit(1);
  }
  if (sessionId) {
    console.log(chalk.green('Authentication OK'));
  }
  // ask upload or download
  let methodType = null;
  if (mode === 'interactive') {
    if (!conf.get('method')) {
      methodType = await inquirer.askMethodType();
      console.log(`You have selected to ${conf.get('method')} data`);
    } else {
      methodType = {};
      methodType.DataType = conf.get('method');
      console.log(`You have selected to ${conf.get('method')}`);
    }
  }
  if (mode === 'non-interactive') {
    methodType = {};
    methodType.DataType = options.method;
    console.log(`You have selected to ${options.method}`);
  }

  if (methodType.DataType === 'Download Data') {
    const dataType = await getDataType(mode, options);
    // generate a map of pipeline name and visits based on dataType
    // ask project
    const status = new Spinner('Getting XNAT project, please wait...');
    const selectedProject = await getProject(mode, options, sessionId, host, status);
    const processedExpList = await fetchData
      .get_all_experiments_by_data_type('data:ProcessedData', sessionId, host, selectedProject.project);
    const preProcessedExpList = await fetchData
      .get_all_experiments_by_data_type('data:PreProcessedData', sessionId, host, selectedProject.project);
    // get unique visit number
    let expTypeVisitMap = new Map();
    expTypeVisitMap.set('PROC', []);
    expTypeVisitMap.set('PREPROC', []);
    expTypeVisitMap = utils
      .get_unique_visits(expTypeVisitMap, processedExpList.ResultSet.Result);
    expTypeVisitMap = utils
      .get_unique_visits(expTypeVisitMap, preProcessedExpList.ResultSet.Result);
    // ask visit
    let selectedProcessedVisitIds = null;
    if (dataType.DataType.includes('Processed')) {
      // ask for processed visit number
      selectedProcessedVisitIds = await inquirer.askVisits('Processed Data', expTypeVisitMap.get('PROC'));
    }
    let selectedPreProcessedVisitIds = null;
    if (dataType.DataType.includes('Pre-Processed')) {
      // ask pre-processed visit number
      selectedPreProcessedVisitIds = await inquirer.askVisits('Pre-Processed Data', expTypeVisitMap.get('PREPROC'));
    }

    // get all experiments matching selected visit number
    const matchedProcessedExpList = utils
      .get_matched_experiments(
        selectedProcessedVisitIds.visit,
        processedExpList.ResultSet.Result,
      );
    const matchedPreProcessedExpList = utils
      .get_matched_experiments(
        selectedPreProcessedVisitIds.visit,
        preProcessedExpList.ResultSet.Result,
      );
    // ask pipeline name
    const pipeline = await inquirer.askPipeline();
    const matchedProcessedFiles = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const exp of matchedProcessedExpList) {
      const resources = await fetchData.get_resources(sessionId, host, exp.ID);
      const resourceFileList = resources.ResultSet.Result;
      // filter by pipeline name
      const matchingFiles = utils
        .get_files_matching_pipeline_name(resourceFileList, pipeline.pipeline);
      if (matchingFiles.length) {
        matchingFiles.forEach((file) => {
          matchedProcessedFiles.push(file);
        });
      }
    }

    const matchedPreProcessedFiles = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const exp of matchedPreProcessedExpList) {
      const resources = await fetchData.get_resources(sessionId, host, exp.ID);
      const resourceFileList = resources.ResultSet.Result;
      // filter by pipeline name
      const matchingFiles = utils
        .get_files_matching_pipeline_name(resourceFileList, pipeline.pipeline);
      if (matchingFiles.length) {
        matchingFiles.forEach((file) => {
          matchedPreProcessedFiles.push(file);
        });
      }
    }

    // ask resource to Download
    let selectedFiles = await inquirer.askResourceToDownload(matchedProcessedFiles, 'Processed');
    // download file
    // const downloadStatus = new Spinner('Downloading files, please wait...');
    // downloadStatus.start();
    // eslint-disable-next-line no-restricted-syntax
    await downloadFiles(selectedFiles, sessionId, host);
    selectedFiles = await inquirer.askResourceToDownload(matchedPreProcessedFiles, 'Pre-Processed');
    await downloadFiles(selectedFiles, sessionId, host);
    // downloadStatus.stop();
    return 0;
  }
  if (methodType.DataType === 'Upload Data') {
    let dataType = {};
    if (mode === 'interactive') {
      if (!conf.get('data_type')) {
        dataType = await inquirer.askDataType('upload');
      } else {
        dataType.DataType = conf.get('data_type');
      }
    }
    if (mode === 'non-interactive') {
      dataType.DataType = options.data_type;
    }
    let selectedProject = null;
    if (mode === 'interactive') {
      if (!conf.get('project')) {
        const status = new Spinner('Getting XNAT project, please wait...');
        status.start();
        await sleep(1000);
        const allProjects = await fetchData.get_all_projects(sessionId, host);
        status.stop();
        // prompt user  to select a project
        // eslint-disable-next-line no-unused-vars
        selectedProject = await inquirer.askProject(allProjects);
      }
    }
    // get list of file to upload
    const fileReadStatus = new Spinner('Reading directory, please wait...');
    fileReadStatus.start();
    await sleep(1000);
    const filteredFileList = [];

    try {
      const fileList = await fs.readdir(files.getCurrentDirectoryBase());
      fileList.forEach((file) => {
        if ((file.startsWith('TRACKFA_PROC') && file.endsWith('zip'))
            || (file.startsWith('TRACKFA_PREPROC') && file.endsWith('zip'))) {
          filteredFileList.push(file);
        }
      });
    } catch (err) {
      console.error(err);
    }
    fileReadStatus.stop();
    // format for zip file name TRACKFA_PROC01_BrainMorph_BrainT1_FreeSurfer_Aachen_24Mar2020.zip
    // unzip file and verify content
    const extractToFolderList = [];
    filteredFileList.forEach((file) => {
      const zip = new AdmZip(file);
      // extract this zip file
      const extractToFolder = `./${file.replace('.zip', '')}_extracted`;
      try {
        zip.extractAllTo(extractToFolder, true);
        extractToFolderList.push(extractToFolder);
      } catch (e) {
        console.log(`cannot extract file from provided zip file:${file}`);
      }
    });
    // rename
    extractToFolderList.forEach((folder) => {
      const visitNumberString = String(folder.split('_')[1]);
      const dataTypeString = visitNumberString.match(/\D+/g);
      const visitNumber = visitNumberString.match(/\d+/g);
      const piplineName = folder.split(/TRACKFA_[A-z]+[0-9]+_/)[1].slice(0, -10);
      fs.readdirSync(folder).forEach(((subFolder) => {
        const subjectId = subFolder.split('_')[1];
        // rename subfolder
        console.log(`${chalk.yellow(`Renaming ${subFolder}`)} to ${chalk.green(`TRACKFA_${subjectId}_${dataTypeString}${visitNumber}_${piplineName}`)}`);
        fs.renameSync(`${folder}/${subFolder}`, `${folder}/TRACKFA_${subjectId}_${dataTypeString}${visitNumber}_${piplineName}`);
        // zip renamed folder
      }));
    });
    // zip renamed folders
    extractToFolderList.forEach((folder) => {
      const subFolders = fs.readdirSync(folder);
      subFolders.forEach((elem) => {
        const folderToZip = new AdmZip();
        folderToZip.addLocalFolder(`${folder}/${elem}`);
        // create a subfolder if not exist
        const folderName = './upload_folder';
        try {
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
          }
        } catch (err) {
          console.log(err);
        }
        folderToZip.writeZip(`upload_folder/${elem}.zip`);
      });
    });
    // delete extracted folders
    extractToFolderList.forEach((folder) => {
      fs.rmdirSync(folder, { recursive: true });
    });
    // iterate and get processed file
    const processedList = [];
    const preProcessedList = [];
    const uploadFileList = await fs.readdir('./upload_folder/');
    uploadFileList.forEach((file) => {
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
    console.log(preProcessedList);
    fileReadStatus.stop();
    // eslint-disable-next-line no-restricted-syntax
    for (const elem of dataType.DataType) {
      if (elem === 'Processed') {
        const ProcessedFileReadStatus = new Spinner('looking for processed data to upload, please wait...');
        ProcessedFileReadStatus.start();
        await sleep(1000);
        // find list of processed data to upload
        ProcessedFileReadStatus.stop();
        const dataObj = await processedFiles.processed_files(processedList, sessionId, host, true, 'ProcessedData');
        const subjectToCreate = dataObj.get('subject_create');
        const expToCreate = dataObj.get('exp_create');
        const fileToUpload = dataObj.get('resource_upload');
        if (subjectToCreate.length > 0) {
          console.log(chalk.green(`This run will create following ${subjectToCreate.length} subjects`));
          console.log(chalk.green(`    ${subjectToCreate} `));
        }
        if (expToCreate.length > 0) {
          console.log(chalk.green(`This run will create following ${expToCreate.length} experiments`));
          console.log(chalk.green(`    ${expToCreate} `));
        }
        if (fileToUpload.length > 0) {
          console.log(chalk.green(`This run will upload  following ${fileToUpload.length} files`));
          console.log(chalk.green(`    ${fileToUpload} `));
        }
        if (subjectToCreate.length === 0 || expToCreate.length === 0 || fileToUpload.length === 0) {
          console.log(chalk.red('No new processed data found in current directory'));
        }

        // ask user if he wants to continue
        if (mode === 'interactive') {
          if (subjectToCreate.length > 0 || expToCreate.length > 0 || fileToUpload.length > 0) {
            const userResponse = await inquirer.askContinue();
            if (userResponse.continue) {
            // upload
              await processedFiles.processed_files(processedList, sessionId, host, false, 'ProcessedData');
            } else {
              return process.exit(1);
            }
          }
        }
        if (mode === 'non-interactive') {
          await processedFiles.processed_files(processedList, sessionId, host, false, 'ProcessedData');
        }

        // read all files in a folder
      } else if (elem === 'Pre-Processed') {
        const PreProcessedFileReadStatus = new Spinner('looking for pre-processed data to upload, please wait...');
        PreProcessedFileReadStatus.start();
        await sleep(1000);
        PreProcessedFileReadStatus.stop();
        const dataObj = await processedFiles.processed_files(preProcessedList, sessionId, host, true, 'PreProcessedData');
        const subjectToCreate = dataObj.get('subject_create');
        const expToCreate = dataObj.get('exp_create');
        const fileToUpload = dataObj.get('resource_upload');
        if (subjectToCreate.length > 0) {
          console.log(chalk.green(`This run will create following ${subjectToCreate.length} subjects`));
          console.log(chalk.green(`    ${subjectToCreate} `));
        }
        if (expToCreate.length > 0) {
          console.log(chalk.green(`This run will create following ${expToCreate.length} experiments`));
          console.log(chalk.green(`    ${expToCreate} `));
        }
        if (fileToUpload.length > 0) {
          console.log(chalk.green(`This run will upload  following ${fileToUpload.length} files`));
          console.log(chalk.green(`    ${fileToUpload} `));
        }
        if (subjectToCreate.length === 0 || expToCreate.length === 0 || fileToUpload.length === 0) {
          console.log(chalk.red('No new pre-processed data found in current directory'));
        }

        if (mode === 'interactive') {
          if (subjectToCreate.length > 0 || expToCreate.length > 0 || fileToUpload.length > 0) {
            const userResponse = await inquirer.askContinue();
            if (userResponse.continue) {
            // upload
              await processedFiles.processed_files(preProcessedList, sessionId, host, false, 'PreProcessedData');
            } else {
              return process.exit(1);
            }
          }
        }
        if (mode === 'non-interactive') {
          await processedFiles.processed_files(preProcessedList, sessionId, host, false, 'PreProcessedData');
        }
      } else {
      // TODO raw data

      }
    }
  }
  return 0;
};
const options = yargs
  .usage('Usage: Command <Options>')
  .example(chalk.yellow('- Upload Processed and Pre-Processed data in non-interactive mode:'))
  .example(chalk.green('   n -h https://xnat.monash.edu/ -u myUserName -p myPassword -m "Upload Data" -d "Pre-Processed" "Processed" -o TRACK-FA'))
  .command(['interactive', 'i'], 'Run in interactive mode', {}, () => { console.log('Running in interactive mode'); })
  .command(['non-interactive', 'n'], 'Run in non-interactive mode',
    () => yargs
      .option('host', {
        alias: 'h', describe: 'XNAT host URL', type: 'string', demandOption: true,
      })
      .option('username', {
        alias: 'u', describe: 'XNAT username', type: 'string', demandOption: true,
      })
      .option('password', {
        alias: 'p', describe: 'XNAT password', type: 'string', demandOption: true,
      })
      .option('method', {
        alias: 'm', describe: 'Choose upload or Download', type: 'string', choices: ['Upload Data', 'Download Data'], demandOption: true,
      })
      .option('data_type', {
        alias: 'd', describe: 'Choose data type', type: 'array', choices: ['Processed', 'Pre-Processed', 'Raw'], demandOption: true,
      })
      .option('project', {
        alias: 'o', describe: 'Choose project', type: 'string', demandOption: true,
      }),
    () => {
      console.log('Running in non-interactive mode');
      // run
    })
  .demandCommand()
  .help()
  .argv;

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

run(
  options,
);
// run();
