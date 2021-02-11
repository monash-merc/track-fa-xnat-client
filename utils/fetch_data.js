const fetch = require("node-fetch");

module.exports = {
    authenticate_user: async (username, password, host) => {
        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
            },
            redirect: 'follow'
        };
        try{
            const response = await  fetch(`${host}data/JSESSION`, requestOptions);
            return await response.text();
        } catch (error ){
            console.log(error)
        }
    },
    get_all_projects: async (cookie, host) => {
         var requestOptions = {
          method: 'GET',
          headers: {
              cookie: "JSESSIONID="+cookie
          },
          redirect: 'follow'
        };
         try{
             const response = await fetch(`${host}data/projects?format=json`, requestOptions)
             return await response.json();
         } catch (error) {
             console.log(error)
         }
    },
    check_subjects: async (cookie, host, subject) => {
         var requestOptions = {
          method: 'GET',
          headers: {
              cookie: "JSESSIONID="+cookie
          },
          redirect: 'follow'
        };
         try{
             const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}?format=json`, requestOptions)
             //console.log(response.json())
             return !!response.ok;
         } catch (error) {
             console.log(error)
         }
    },
    check_experiments: async (cookie, host, exp, subject) => {
         var requestOptions = {
          method: 'GET',
          headers: {
              cookie: "JSESSIONID="+cookie
          },
          redirect: 'follow'
        };
         try{
             const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}?format=json`, requestOptions)
             //console.log(response.json())
             return !!response.ok;
         } catch (error) {
             console.log(error)
         }
    },
    create_experiment: async (cookie, host, exp, subject, datatype) => {
         var requestOptions = {
          method: 'PUT',
          headers: {
              cookie: "JSESSIONID="+cookie
          },
          redirect: 'follow'
        };
         try{
             const response = await fetch(`${host}data/projects/TRACKFA/subjects/${subject}/experiments/${exp}?xnat:${datatype}/acquisition_site=Monash`, requestOptions)
             //console.log(response.json())
             return !!response.ok;
         } catch (error) {
             console.log(error)
         }
    },
    add_resource: async (cookie, host, exp, subject, datatype, file) => {
         var requestOptions = {
          method: 'PUT',
          headers: {
              cookie: "JSESSIONID="+cookie
          },
          redirect: 'follow'
        };
         try{
             const response = await fetch(`${host}data/experiments/${exp}/resources/${exp}/files/${file}`, requestOptions)
             //console.log(response.json())
             return !!response.ok;
         } catch (error) {
             console.log(error)
         }
    }
}