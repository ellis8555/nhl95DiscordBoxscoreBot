import { Worker } from "node:worker_threads";

function createWorker(workerFile, workerData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerFile, { workerData });
  
      // Listen for messages from the worker
      worker.on('message', (result) => resolve(result));
  
      // Handle worker errors
      worker.on('error', (error) => reject(error));
  
      // Handle worker exiting without completion
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  export default createWorker;