const fs = require('fs');
const path = require('path');

module.exports = {
  getCurrentDirectoryBase: () => {
    return (process.cwd());
  },

  directoryExists: (filePath) => {
    return fs.existsSync(filePath);
  }
};