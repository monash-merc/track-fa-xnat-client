const fs = require('fs');

module.exports = {
  getCurrentDirectoryBase: () => (process.cwd()),

  directoryExists: (filePath) => fs.existsSync(filePath),
};
