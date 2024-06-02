const http = require('http');
const https = require('https');
require('dotenv').config();

const webhookId = process.env.WEBHOOK_ID;
const webhookToken = process.env.WEBHOOK_TOKEN;
const discordWebhookUrl = `https://discordapp.com/api/webhooks/${webhookId}/${webhookToken}`;
const webhookUrl = new URL(discordWebhookUrl);

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const payload = JSON.parse(body);
            const commitMessage = payload.head_commit ? payload.head_commit.message : 'No commit message';
            const commitUrl = payload.head_commit ? payload.head_commit.url : 'No commit URL';
            const repoName = payload.repository ? payload.repository.full_name : 'No repository name';
            const pusher = payload.pusher ? payload.pusher.name : 'No pusher name';

            const message = {
                content: `New commit in ${repoName} by ${pusher}: [${commitMessage}](${commitUrl})`
            };

            const data = JSON.stringify(message);

            const webhookOptions = {
                hostname: webhookUrl.hostname,
                port: webhookUrl.port || 443,
                path: webhookUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const webhookReq = https.request(webhookOptions, webhookRes => {
                webhookRes.on('data', d => {
                    process.stdout.write(d);
                });
            });

            webhookReq.on('error', e => {
                console.error(e);
            });

            webhookReq.write(data);
            webhookReq.end();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Payload received' }));
        });
    } else if (req.method === 'GET' && req.url === '/webhook') {
        console.log('Received a GET request to /webhook');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'This endpoint is for POST requests only' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
