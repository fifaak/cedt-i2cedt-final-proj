const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple proxy to backend API (no extra libraries)
app.use('/api', (req, res) => {
	const backendHost = 'localhost';
	const backendPort = 3001;
	const options = {
		hostname: backendHost,
		port: backendPort,
		path: req.originalUrl,
		method: req.method,
		headers: {
			...req.headers,
			host: `${backendHost}:${backendPort}`
		}
	};

	const proxyReq = http.request(options, (proxyRes) => {
		let data = [];
		proxyRes.on('data', (chunk) => data.push(chunk));
		proxyRes.on('end', () => {
			const buffer = Buffer.concat(data);
			// Pass through status and headers (filter hop-by-hop)
			const headers = { ...proxyRes.headers };
			delete headers['content-encoding'];
			res.status(proxyRes.statusCode || 500).set(headers).send(buffer);
		});
	});

	proxyReq.on('error', (err) => {
		console.error('Proxy error:', err.message);
		res.status(502).json({ error: 'Bad Gateway', details: err.message });
	});

	// Forward body for non-GET
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
		if (body) {
			proxyReq.setHeader('content-type', 'application/json');
			proxyReq.setHeader('content-length', Buffer.byteLength(body));
			proxyReq.write(body);
		}
	}

	proxyReq.end();
});

// Serve static files from the public and src directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src'), { setHeaders: (res) => res.set('Content-Type', 'application/javascript') }));

// Serve the main HTML file for all other routes (SPA support)
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
	console.log(`Frontend server is running on http://localhost:${PORT}`);
	console.log(`Proxying /api -> http://localhost:3001/api`);
});
