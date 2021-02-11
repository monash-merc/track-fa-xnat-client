const inquirer = require('inquirer');

module.exports = {
  askXNATCredentials: () => {
    const questions = [
      {
        name: 'host',
        type: 'input',
        message: 'Enter XNAT host URL',
        validate: function(value) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter XNAT host URL.';
          }
        }
      },
      {
        name: 'username',
        type: 'input',
        message: 'Enter your XNAT username',
        validate: function( value ) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter XNAT username.';
          }
        }
      },
      {
        name: 'password',
        type: 'password',
        message: 'Enter your XNAT password:',
        validate: function(value) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter your XNAT password.';
          }
        }
      }
    ];
    return inquirer.prompt(questions);
  },
  askDataType: () => {
      const questions = [
          {
              name: 'DataType',
              type: 'checkbox',
              message: 'Select type of data you want to upload',
              choices: ['Processed', 'Pre-Processed', 'Raw'],
              validate: function( value ) {
                  if (value.length) {
                      return true;
                  } else {
                      return 'Please Select type of data you want to upload';
                  }
        }
          }
      ];
      return inquirer.prompt(questions)
  },
  askProject: (data) => {
      const resultSet = data['ResultSet'];
      const projectList = resultSet['Result'];
      let list = [];
      for (const project of projectList.entries()) {
          list.push(project[1].name)
      }

      const questions = [
          {
              name: 'project',
              type: 'list',
              message: 'Select a project to upload',
              choices: list,
              validate: function( value ) {
                  if (value.length) {
                      return true;
                  } else {
                      return 'Please Select project to upload';
                  }
        }
          }
      ];
      return inquirer.prompt(questions)
  }
};