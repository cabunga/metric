const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;
const bodyParser = require('body-parser');

app.use(bodyParser.json());

class WorkflowInfo {
  constructor(ultimaEjecucion, tagValor, imgTagValor) {
    this.WORKFLOW_NAME = ultimaEjecucion.workflow_name;
    this.name = ultimaEjecucion.name;
    this.STATUS = ultimaEjecucion.status;
    this.fecha = ultimaEjecucion.started_at;
    this.tag = tagValor || 'No se encontró tag';
    this.IMGTAG = imgTagValor || 'No se encontró IMGTAG';
  }
}

async function buscarDatoEnLogs(logs) {
  return new Promise((resolve, reject) => {
    const regex = /(tag|IMGTAG):\s+(\S+)/g;
    let tagEncontrado = 0;
    let key, value;
    let tagValor, imgTagValor;

    while ((match = regex.exec(logs)) !== null) {
      key = match[1];
      value = match[2];
      tagEncontrado++;
      console.log(`${key} : ${value}`);

      if (tagEncontrado === 1) {
        tagValor = `${value}`;
      }
      if (tagEncontrado === 2) {
        imgTagValor = `${value}`;
        resolve({
          tag: tagValor || 'No se encontró tag',
          IMGTAG: imgTagValor || 'No se encontró IMGTAG',
        });
        return;
      }
    }

    // Si llegamos aquí, significa que no se encontraron ambos tags
    reject('No se encontraron ambos tags en los logs' + logs);
  });
}
app.post('/setWorkflowNameAndURL', (req, res) => {
  const { WORKFLOW_NAME, URL_PART,GITHUB_TOKEN } = req.body;
  app.set('WORKFLOW_NAME', WORKFLOW_NAME);
  app.set('URL_PART', URL_PART);
  app.set('GITHUB_TOKEN', GITHUB_TOKEN);
  res.json({ message: 'Notificacion recibida' });
});

app.get('/getTags', async (req, res) => {
  try {
    const GITHUB_TOKEN =  app.get('GITHUB_TOKEN') || '';
    const WORKFLOW_NAME = app.get('WORKFLOW_NAME') || 'Deploy Payment DOM';
    const URL_PART = app.get('URL_PART') || 'Pipelines-dom';

    let datoBuscado = '';
    var jobStatus = 'demo';
    let ultimaEjecucion='';
    let workflowInfoArray = [];
    // Obtener información sobre las ejecuciones de los workflows
    const workflowsResponse = await axios.get(`${URL_PART}/actions/runs`, {            
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });

    const workflows = workflowsResponse.data;
    const workflow = workflows.workflow_runs.find(run => run.name === WORKFLOW_NAME);

    if (workflow) {
      console.log(`Se encontró el ID del workflow ${WORKFLOW_NAME}: ${workflow.id}`);
      jobStatus = `Se encontró el ID del workflow ${WORKFLOW_NAME}: ${workflow.id}`;

      // Obtener información sobre la última ejecución del workflow
      const jobsResponse = await axios.get(`${URL_PART}/actions/runs/${workflow.id}/jobs?page=2`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      });

       ultimaEjecucion = jobsResponse.data.jobs.find(job => job.id);

      if (ultimaEjecucion) {
        console.log(`Información de la última ejecución del workflow: ${ultimaEjecucion.id}`);
        console.log(`STATUS: ${ultimaEjecucion.status}`);
        jobStatus = `STATUS: ${ultimaEjecucion.status}`;

        // Obtener logs de la última ejecución
        const logsResponse = await axios.get(`${URL_PART}/actions/jobs/${ultimaEjecucion.id}/logs`, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
          },
        });

        datoBuscado = logsResponse.data;
        datoBuscado = await buscarDatoEnLogs(datoBuscado);
        
      } else {
        console.log('No se pudo obtener información sobre la última ejecución del workflow.');
      }
    } else {
      console.log(`No se encontró el workflow con el nombre '${WORKFLOW_NAME}'.`);
    }

    console.log('envia' + JSON.stringify(datoBuscado));
    const workflowInfo = new WorkflowInfo(ultimaEjecucion, datoBuscado.tag, datoBuscado.IMGTAG);
    workflowInfoArray.push(workflowInfo);
    
    const result =  JSON.stringify(jobStatus);
    res.json(workflowInfoArray);
  } catch (error) {
    console.error('Error en la búsqueda de datos en logs:', error);
    res.status(500).json({ error: 'Error en la búsqueda de datos en logs' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
