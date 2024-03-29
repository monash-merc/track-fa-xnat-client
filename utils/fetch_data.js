const CLI = require('clui');

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const chalk = require('chalk');
const nodeUrl = require('url');
const nodePath = require('path');

const { Spinner } = CLI;

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
  check_subjects: async (cookie, host, subject, selectedProject) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}?format=json`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  create_subjects: async (cookie, host, subject, selectedProject) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}?format=json`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  check_experiments: async (cookie, host, exp, subject, selectedProject) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}/experiments/${exp}?format=json`, requestOptions);
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
  get_all_experiments: async (cookie, host, project, subject) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${project}/subjects/${subject}/experiments?format=json`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  create_experiment: async (cookie, host, exp, subject, datatype, selectedProject) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}/experiments/${exp}?xnat:${datatype}/acquisition_site=Monash`, requestOptions);
      // console.log(response.json())
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  add_resource: async (cookie, host, exp, subject, datatype, file, selectedProject) => {
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
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}/experiments/${exp}/resources/${exp}/files/${file.split('/')[1]}?format=zip`, requestOptions);
      console.log(await response.text());
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_resource: async (cookie, host, exp, subject, selectedProject) => {
    const requestOptions = {
      method: 'PUT',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };

    try {
      const response = await fetch(`${host}data/projects/${selectedProject}/subjects/${subject}/experiments/${exp}/resources/`, requestOptions);
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
  delete_resource: async (cookie, host, uri) => {
    const requestOptions = {
      method: 'DELETE',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    const urlPath = new nodeUrl.URL(host);
    urlPath.pathname = nodePath.join(uri);

    try {
      const response = await fetch(urlPath.toString(), requestOptions);
      return !!response.ok;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  // eslint-disable-next-line consistent-return
  download_file: async (cookie, host, file, path) => {
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
      const fileStream = fs.createWriteStream(`${path}/${fileName}`);
      return await new Promise((resolve, reject) => {
        const downloadFileStatus = new Spinner(`Downloading file ${file}, please wait...\n`);
        downloadFileStatus.start();
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', () => {
          console.log(chalk.green(`File ${fileName} downloaded to ${path}`));
          resolve();
          downloadFileStatus.stop();
        });
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  download_mr_zip: async (cookie, host, url, path, fileName) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      // const fileInfo = null;
      const response = await fetch(`${host}${url}`, requestOptions);
      const fileStream = fs.createWriteStream(`${path}/${fileName}`);
      return await new Promise((resolve, reject) => {
        const downloadFileStatus = new Spinner('Downloading file, please wait...\n');
        downloadFileStatus.start();
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', () => {
          console.log(chalk.green(`File downloaded to ${path}`));
          resolve();
          downloadFileStatus.stop();
        });
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  get_all_experiments_by_data_type: async (expType, cookie, host, project) => {
    const requestOptions = {
      method: 'GET',
      headers: {
        cookie: `JSESSIONID=${cookie}`,
      },
      redirect: 'follow',
    };
    try {
      const response = await fetch(`${host}data/projects/${project}/experiments/?xsiType=${expType}&format=json`, requestOptions);
      return await response.json();
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};
