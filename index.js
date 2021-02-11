const chalk = require('chalk');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const clear = require('clear');
const figlet = require('figlet');
const files = require('./lib/file')
const inquirer  = require('./lib/xnat-credentials');
const Configstore = require('configstore');
const fetchData = require('./utils/fetch_data')
const fs = require('mz/fs');

clear();
console.log(
    chalk.yellow(
        figlet.textSync('---------------------', { font: 'big', horizontalLayout: 'full'})
    )
)

console.log(
    chalk.yellow(
        figlet.textSync('TRACK-FA-XNAT-CLIENT', { font: 'big', horizontalLayout: 'full'})
    )
)
console.log(
    chalk.green('A XNAT Client to upload and download Post-Processed or Processed data for TRACK-FA Project')
)
console.log(
    chalk.yellow(
        figlet.textSync('---------------------', { font: 'big', horizontalLayout: 'full'})
    )
)
console.log(
    chalk.green(
        'Current directory is: '+ files.getCurrentDirectoryBase())
)

const run = async () => {
  // check if credentials exist in store
  const conf = new Configstore('credentials');
  let username = conf.get('username');
  let password = conf.get('password');
  let host = conf.get('host');
  if(username && password && host) {
      console.log(
          chalk.yellow('Found existing XNAT credentials at '+ conf.path)
      )
  } else {
      const credentials = await inquirer.askXNATCredentials();
      conf.set('host', credentials.host)
      conf.set('username', credentials.username);
      conf.set('password', credentials.password)
      host = conf.get('host');
      username = conf.get('username');
      password = conf.get('password');
  }
  //authenticate user
  const sessionId = await fetchData.authenticate_user(username, password, host);
  if(sessionId) {
      console.log(chalk.green('Authentication OK'))
  }
  const dataType = await  inquirer.askDataType();
  console.log(dataType);
  //get list of project
  const status = new Spinner('Getting XNAT project, please wait...');
  status.start()
    await sleep(1000)
    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }
  const all_projects = await fetchData.get_all_projects(sessionId,host);
  status.stop()
  // prompt user  to select a project
  const selected_project = await inquirer.askProject(all_projects);
  //get list of file to upload
  const fileReadStatus = new Spinner('Reading directory, please wait...');
  fileReadStatus.start()
  await sleep(1000)
  let filteredFileList = [];

    try {
        const fileList = await fs.readdir(files.getCurrentDirectoryBase());
        fileList.forEach(file => {
            if(file.startsWith('TRACKFA')){
                filteredFileList.push(file);
            }
        });
    }catch (err) {
        console.error( err )
    }
    // format for file name TRACKFA_UMN001_PREPROC01_QSM.zip
    // iterate and get processed file
    let processedList = []
    let preProcessedList = []
    filteredFileList.forEach(file => {
        const file_split_arr = file.split("_")
        const subject = file_split_arr[1]
        const fileType = file_split_arr[2]
        if(fileType.startsWith('PRO')){
            // add to processed list
            processedList.push(file)
        }
        if(fileType.startsWith('PRE')){
            // add to processed list
            preProcessedList.push(file)
        }
    })
    fileReadStatus.stop()
    for (const elem of dataType['DataType']) {
        if(elem === 'Processed') {
             const ProcessedFileReadStatus = new Spinner('looking for processed data to upload, please wait...');
             ProcessedFileReadStatus.start()
             await sleep(1000)
            //find list of processed data to upload
            ProcessedFileReadStatus.stop()
            console.log(processedList)
            for (const file of processedList) {
                const file_split_arr = file.split("_")
                const subject = file_split_arr[1]
                const fileType = file_split_arr[2]
                //check if subject exist
                const subject_exist = await fetchData.check_subjects(sessionId,host, subject)
                if(subject_exist){
                    console.log(chalk.yellow(`Found subject with id ${subject}`))
                } else {
                    // create subject
                }
                //check if experiment exist
                const exp_exist = await  fetchData.check_experiments(sessionId, host, fileType)
                if(exp_exist){
                    console.log(chalk.yellow(`Found exp with label ${fileType}`))
                }else {
                    console.log(chalk.red(`No exp with label ${fileType} found for subject ${subject}`))
                    console.log(chalk.green(`Creating exp with label ${fileType} `))
                    const exp_created = await fetchData.create_experiment(sessionId, host, fileType, subject, "ProcessedData")
                    if(exp_created){
                        console.log(`Created Processed Data experiment with label ${fileType}`)
                    } else{
                        //handle this
                    }
                    // attach resource
                    const resource_created = await fetchData.add_resource(sessionId,host,fileType,subject,"", file)

                }
            }
            // read all files in a folder
        } else if ( elem === 'Pre-Processed'){
            const PreProcessedFileReadStatus = new Spinner('looking for processed data to upload, please wait...');
             PreProcessedFileReadStatus.start()
             await sleep(1000)
            PreProcessedFileReadStatus.stop()
            console.log(preProcessedList)
        }else {

        }
    }

};

run();