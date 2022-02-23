const inquirer = require('inquirer');

module.exports = {
  askXNATCredentials: () => {
    const questions = [
      {
        name: 'host',
        type: 'input',
        message: 'Enter XNAT host URL',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please enter XNAT host URL.';
        },
      },
      {
        name: 'username',
        type: 'input',
        message: 'Enter your XNAT username',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please enter XNAT username.';
        },
      },
      {
        name: 'password',
        type: 'password',
        message: 'Enter your XNAT password:',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please enter your XNAT password.';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askDataType: (type) => {
    const questions = [
      {
        name: 'DataType',
        type: 'checkbox',
        message: `Select type of data you want to ${type}`,
        choices: ['Processed', 'Pre-Processed', 'Raw'],
        validate(value) {
          if (value.length) {
            return true;
          }
          return `Select type of data you want to ${type}`;
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askMethodType: () => {
    const questions = [
      {
        name: 'DataType',
        type: 'list',
        message: 'What do you want to do',
        choices: ['Download Data', 'Upload Data'],
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select type of data you want to upload';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askProject: (data) => {
    const resultSet = data.ResultSet;
    const projectList = resultSet.Result;
    const list = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const project of projectList.entries()) {
      const valueObj = Object.create({});
      valueObj.name = project[1].name;
      valueObj.value = project[1].ID;
      list.push(valueObj);
    }

    const questions = [
      {
        name: 'project',
        type: 'list',
        message: 'Select a project',
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select project';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askSubject: (data) => {
    const resultSet = data.ResultSet;
    const subjectList = resultSet.Result;
    const list = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const subject of subjectList.entries()) {
      const valueObj = Object.create({});
      valueObj.name = subject[1].name;
      valueObj.value = subject[1].ID;
      list.push(valueObj);
    }

    const questions = [
      {
        name: 'subject',
        type: 'list',
        message: 'Select a subject',
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select subject';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askContinue: () => {
    const questions = [
      {
        name: 'continue',
        type: 'confirm',
        message: 'Do you want to continue',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Do you want to continue';
        },
      },

    ];
    return inquirer.prompt(questions);
  },
  askSubjects: (data) => {
    const resultSet = data.ResultSet;
    const subjectList = resultSet.Result;
    const list = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const subject of subjectList.entries()) {
      const valueObj = Object.create({});
      valueObj.name = subject[1].label;
      valueObj.value = subject[1].ID;
      list.push(valueObj);
    }
    const questions = [
      {
        name: 'subject',
        type: 'checkbox',
        message: 'Select subjects',
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select subjects';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askexperiments: (data) => {
    const list = [];
    // eslint-disable-next-line no-restricted-syntax,array-callback-return
    data.map((exp) => {
      if (exp) {
        const valueObj = Object.create({});
        valueObj.name = exp.label;
        valueObj.value = exp.ID;
        list.push(valueObj);
      }
    });
    const questions = [
      {
        name: 'experiments',
        type: 'checkbox',
        message: 'Select experiments',
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select experiments';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askResourceToDownload: (data, fileType) => {
    const list = [];
    // eslint-disable-next-line no-restricted-syntax,array-callback-return
    data.map((res) => {
      if (res) {
        const valueObj = Object.create({});
        valueObj.name = res.Name;
        valueObj.value = res.URI;
        list.push(valueObj);
      }
    });
    const questions = [
      {
        name: 'files',
        type: 'checkbox',
        message: `Select ${fileType} files to download`,
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select resorces';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askVisits: (dataType, data) => {
    const list = [];
    data.forEach((elem) => {
      const valueObj = Object.create({});
      valueObj.name = elem;
      valueObj.value = elem;
      list.push(valueObj);
    });
    const questions = [
      {
        name: 'visit',
        type: 'checkbox',
        message: `Select visit number for ${dataType}`,
        choices: list,
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please Select visit number';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askVisitsInput: () => {
    const questions = [
      {
        name: 'visit',
        type: 'input',
        message: 'Please enter a visit',
        validate(value) {
          if (value.length) {
            if (!isNaN(value)) {
              return true;
            }
          }
          return 'Please provide a visit number';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
  askAdditionalVisit: () => {
    const questions = [
      {
        name: 'continue',
        type: 'confirm',
        message: 'Do you want to add another visit',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Do you want to add another visit';
        },
      },
    ];
    return inquirer.prompt(questions);
  }, 
  askPipeline: () => {
    const questions = [
      {
        name: 'pipeline',
        type: 'input',
        message: 'Please provide pipeline name',
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please provide pipeline name';
        },
      },

    ];
    return inquirer.prompt(questions);
  },
};
