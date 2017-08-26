import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import * as path from 'path';

// requests/webhooks
import request from 'request';
import requestPromise from 'request-promise';
import Promise from 'bluebird';

let app = express();
app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware for cors
app.use(cors());

// body parser for POSTs
app.use(bodyParser.json({
    limit : '100kb'
}));

// expose output dir (/var/www/dist/output) as static directory at root route
app.use(express.static(path.join(__dirname, 'static')));

// test
app.get('/', (req, res) => {
    res.json({
        message: 'huehuehue'
    });
});

// Start listening
app.server.listen(process.env.PORT || 80, () => {
    console.log(`Started on port ${app.server.address().port}`);
});

export default app;