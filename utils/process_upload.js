const chalk = require('chalk');

const CLI = require('clui');
const fetchData = require('./fetch_data');

const { Spinner } = CLI;
module.exports = {
  processed_files: async function
  processedFiles(fileList, sessionId, host, dryRun, datatype, selectedProject) {
    console.log(selectedProject);
    const returnObj = new Map();
    const subjectToCreate = [];
    const expToCreate = [];
    const fileToUpload = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileSplitArr = file.split('_');
      const subject = fileSplitArr[1];
      const fileType = fileSplitArr[2];
      const expName = `${subject}_${fileType}`;
      // check if subject exist
      const subjectExist = await fetchData
        .check_subjects(sessionId, host, subject, selectedProject);
      if (subjectExist) {
        console.log(chalk.yellow(`Found subject with id ${subject}`));
      } else if (!subjectExist && !dryRun) {
      // create subject
      // subject will be created while creating experiment
        const subjectCreated = await fetchData
          .create_subjects(sessionId, host, subject, selectedProject);
        if (subjectCreated) {
          console.log(`Created subject ${subject}`);
        }
      } else if (!subjectExist && dryRun) {
        subjectToCreate.push(subject);
      }
      // check if experiment exist
      const expExist = await fetchData
        .check_experiments(sessionId, host, expName, subject, selectedProject);

      // create experiment
      if (expExist) {
        console.log(chalk.yellow(`Found exp with label ${expName}`));
      } else if (dryRun && !expExist) {
        expToCreate.push(expName);
      } else {
        console.log(chalk.red(`No exp with label ${expName} found for subject ${subject}`));
        console.log(chalk.green(`Creating exp with label ${expName} `));
        const expCreated = await fetchData
          .create_experiment(sessionId, host, expName, subject, datatype, selectedProject);
        if (expCreated) {
          console.log(`Created ${datatype} Data experiment with label ${expName}`);
        } else {
        // handle this
        }
      }
      // attach resource
      if (dryRun) {
      // check if resource exist
        const resourceExist = await fetchData
          .get_resource(sessionId, host, expName, subject, selectedProject);
        if (!resourceExist) {
          fileToUpload.push(file);
        }
      } else if (!dryRun) {
      // attach resource
        const fileUpoadStatus = new Spinner(`uploading file ${file}....`);
        fileUpoadStatus.start();
        const resourceCreated = await fetchData.add_resource(sessionId, host, expName, subject, '', `upload_folder/${file}`, selectedProject);
        fileUpoadStatus.stop();
        if (resourceCreated) {
          console.log(chalk.green(`${file} uploaded successfully`));
        } else {
          console.log(chalk.red('Something went wrong...'));
        }
      }
    }
    returnObj.set('subject_create', subjectToCreate);
    returnObj.set('exp_create', expToCreate);
    returnObj.set('resource_upload', fileToUpload);
    return returnObj;
  },
};
