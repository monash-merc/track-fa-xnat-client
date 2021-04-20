const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const chalk = require('chalk');

module.exports = {
  authenticate_user: async (username, password, host) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/JSESSION`, requestOptions);
      return response;
    } catch (e) {
      return (e);
    }
  },
  get_all_projects: async (cookie, host) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects?format=json`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_all_subjects: async (cookie, host, project) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${project}/subjects?format=json`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  check_subjects: async (cookie, host, subject) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}?format=json`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  create_subjects: async (cookie, host, subject) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}?format=json`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  check_experiments: async (cookie, host, exp, subject) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}?format=json`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_experiments: async (cookie, host, project, subject, expType) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${project}/subjects/${subject}/experiments/?xsiType=${expType}&format=json`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  create_experiment: async (cookie, host, exp, subject, datatype) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}?xnat:${datatype}/acquisition_site=Monash`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  add_resource: async (cookie, host, exp, subject, datatype, file) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file));
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
      body: formData,
    };
    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}/resources/${exp}/files/${file.split('/')[1]}?format=zip`, requestOptions);
      console.log(await response.text());
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_resource: async (cookie, host, exp, subject) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };

    try {
      const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}/resources/`, requestOptions);
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_resources: async (cookie, host, exp) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };

    try {
      const response = await fetch(`${host}data/experiments/${exp}/files`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  // eslint-disable-next-line consistent-return
  download_file: async (cookie, host, file) => {
    const fileSplit = file.split('/');
    const fileName = fileSplit[fileSplit.length - 1];
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      // const fileInfo = null;
      const response = await fetch(`${host}${file.substring(1)}`, requestOptions);
      const fileStream = fs.createWriteStream(fileName);
      return await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', () => {
          console.log(chalk.green(`File ${fileName} downloaded to ${process.cwd()}`));
          resolve();
        });
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};
