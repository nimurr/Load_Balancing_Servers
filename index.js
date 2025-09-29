const express = require('express');
const cluster = require('cluster');
const { generateKeyPair } = require('crypto');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Assign each worker a different port
  for (let i = 0; i < numCPUs; i++) {
    const port = 3000 + i; // 3000, 3001, 3002, ...
    cluster.fork({ PORT: port });
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });

} else {
  const PORT = process.env.PORT || 3000;
  const app = express();

  app.get('/', (req, res) => {
    res.send(`Hello from Worker ${process.pid} on PORT ${PORT}`);
  });

  app.get('/key', (req, res) => {
    generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'top secret' }
    }, (err, publicKey) => {
      if (err) return res.status(500).send('Key generation failed');
      res.send(`Worker ${process.pid} on PORT ${PORT} \n${publicKey}`);
    });
  });

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on PORT ${PORT}`);
  });
}
