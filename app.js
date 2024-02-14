const express = require('express')
var request = require("request");
const axios = require('axios');
const app = express()
const port = 3001

app.get('/', async (req, res) => {
            
const GITHUB_TOKEN = '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';
const WORKFLOW_NAME = 'Deploy Payment DOM';
let datoBuscado='';
var jobStatus = 'demo';
// Obtener información sobre las ejecuciones de los workflows
axios.get('https://api.github.com/repos/clarovideo-argentina/Pipelines-dom/actions/runs', {
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  },
})
  .then(response => {
    const workflows = response.data;
    const workflow = workflows.workflow_runs.find(run => run.name === WORKFLOW_NAME);

    if (workflow) {
      console.log("Se encontró el ID del workflow"+ WORKFLOW_NAME+": "+workflow.id+"");
      jobStatus =  "Se encontró el ID del workflow "+WORKFLOW_NAME+":"+workflow.id+"";
      // Obtener información sobre la última ejecución del workflow
      return axios.get(`https://api.github.com/repos/clarovideo-argentina/Pipelines-dom/actions/runs/${workflow.id}/jobs?page=2`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      });
    } else {
      console.log(`No se encontró el workflow con el nombre '${WORKFLOW_NAME}'.`);
    }
  })
  .then(response => {
    if (response) {
      const ultimaEjecucion = response.data.jobs.find(job => job.id);

      if (ultimaEjecucion) {
        console.log(`Información de la última ejecución del workflow:${ultimaEjecucion.id}`);
        console.log(`STATUS: ${ultimaEjecucion.status}`);
        //jobStatus =  `STATUS: ${ultimaEjecucion.status}`;
        // Validar el stage en la última ejecución del workflow
        // (El código para validar el stage es el mismo que en el ejemplo anterior)
        axios.get(`https://api.github.com/repos/clarovideo-argentina/Pipelines-dom/actions/jobs/${ultimaEjecucion.id}/logs`, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
          },
        })
          .then(response => {
            datoBuscado =   buscarDatoEnLogs(response.data);
            //console.log(`STATUS: ${response.data}`);
          })
      } else {
        console.log('No se pudo obtener información sobre la última ejecución del workflow.');
      }
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

  
  res.status(200).json(datoBuscado );
})

 function buscarDatoEnLogs(logs) {

  const regex = /(tag|IMGTAG):\s+(\S+)/g;
  //const match = logs.match();
  //const match = regex.exec(logs);


  let tagEncontrado = 0;  
  let key, value;
  
  while ((match = regex.exec(logs)) !== null) {
    
      key = match[1];
    
      value = match[2];
      tagEncontrado++;
      console.log(`${key} : ${value}`);
      if (tagEncontrado == 1 ) {
        tagValor = `${value}`;
      }
    if (tagEncontrado == 2 ) {
      imgTagValor = `${value}`;
      break; // Salir del bucle si ambos se encuentran
    }
  
  }
const jsonResponse = {
    tag: tagValor || 'No se encontró tag',
    IMGTAG: imgTagValor || 'No se encontró IMGTAG',
  };
  return jsonResponse;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})