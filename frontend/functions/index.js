const functions = require('firebase-functions');
const express = require('express');

const app = express();

// Backend URL - change this to your actual backend address
const BACKEND_URL = process.env.BACKEND_URL || 'http://72.61.108.21:3001';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for the proxy
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Proxy is running', backend: BACKEND_URL });
});

// Proxy all other requests to the backend
app.all('*', async (req, res) => {
  try {
    const targetPath = req.path;
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const targetUrl = `${BACKEND_URL}${targetPath}${queryString}`;

    console.log(`[Proxy] ${req.method} ${targetPath} -> ${targetUrl}`);

    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Copy important headers from request
    const headersToProxy = ['authorization', 'x-api-key', 'accept', 'user-agent'];
    headersToProxy.forEach(header => {
      if (req.headers[header]) {
        fetchOptions.headers[header] = req.headers[header];
      }
    });

    // Add request body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the request to backend
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    let responseBody;

    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Send response back to client
    res.status(response.status);
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    res.send(responseBody);
  } catch (error) {
    console.error('[Proxy Error]', error.message);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      details: error.toString()
    });
  }
});

// Export as Cloud Function
exports.api = functions.https.onRequest(app);
