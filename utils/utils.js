module.exports = {
  get_unique_visits(existingList, expList) {
    expList.forEach((exp) => {
      const expType = exp.label.split('_')[2].match(/\D+/g);
      const visitNumber = exp.label.split('_')[2].match(/\d+/g);
      // create a list of visit number
      if (existingList.get(expType[0])) { 
      if (!existingList.get(expType[0]).includes(visitNumber[0])) {
        existingList.get(expType[0]).push(visitNumber[0]);
      }
      // console.log(`${expType} : ${visitNumber}`);
      }
    });
    return existingList;
  },
  get_matched_experiments(visit, processedExpList) {
    const matchedExperimentList = [];
    processedExpList.forEach((exp) => {
      const visitNumber = exp.label.split('_')[2].match(/\d+/g);
      if (visit) {
        if (visit.map(Number).includes(parseInt(visitNumber[0]))) {
        matchedExperimentList.push(exp);
        }
      }
    });
    return matchedExperimentList;
  },
  get_files_matching_pipeline_name(files, pipeline) {
    const matchedFiles = [];
    files.forEach((file) => {
      const pipelineName = file.Name.split(/TRACKFA_[A-z]+[0-9]+_[A-z]+[0-9]+_/)[1].slice(0, -4);
      if (pipelineName === pipeline) {
        matchedFiles.push(file);
      }
    });
    return matchedFiles;
  },
};
