import http from 'http';

const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3001,
    path: '/health',
    method: 'GET',
    timeout: 2000
  };

  const request = http.request(options, (response) => {
    if (response.statusCode === 200) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

  request.on('error', () => {
    process.exit(1);
  });

  request.on('timeout', () => {
    request.destroy();
    process.exit(1);
  });

  request.end();
};

healthCheck();