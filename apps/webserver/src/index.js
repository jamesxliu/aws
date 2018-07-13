import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import * as path from 'path';
import fs from 'fs-extra';
import busboy from 'connect-busboy';

// requests/webhooks
import request from 'request';
import requestPromise from 'request-promise';
import Promise from 'bluebird';

// shell
import * as child from 'child_process';

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

app.use(bodyParser.urlencoded({
    extended: true
}));

// busboy for multipart
app.use(busboy());

// expose output dir (/var/www/dist/output) as static directory at root route
app.use(express.static(path.join(__dirname, 'static')));

// test
app.get('/', (req, res) => {
    res.json({
        message: 'huehuehue'
    });
});

var inProgress = false;

// Upload
app.post('/upload', (req, res, next) => {
    if(inProgress === true) {
        res.sendStatus(400);
    }

    res.setTimeout(0);
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-control": "no-cache"
    });

    let fstream;
    let flags = new String();
    let renderProcess;

    const fieldsToFlags = (fieldName, value) => {
        flags+=` -${fieldName} ${value}`;
        console.log(`Passing argument: -${fieldName} ${value}`);
    };

    const startRender = (fileName) => {
        renderProcess = child.spawn(
            'primitive',
            `-i ./dist/static/input/${fileName} -o ./dist/static/output/${fileName}`.concat(flags).split(' ')
        )
    };

    req.busboy.on('field', fieldsToFlags);

    req.busboy.on('file', (field, file, fileName) => {
        fstream = fs.createWriteStream(`${__dirname}/static/input/${fileName}`);
        file.pipe(fstream);
        fstream.on('close', () => {
            console.info('Uploaded', fileName);
            startRender(fileName);
            renderProcess.stdout.pipe(res);
            renderProcess.on('close', (code, signal) => {
                console.log('Rendering exit: ', signal);
                fs.emptyDir(`${__dirname}/static/input`, (err) => {
                    if(!err) {
                        console.log('Cleaned up input.');
                    }else {
                        console.error(err);
                    }
                })
            });
        });
    });

    req.pipe(req.busboy);
});

// Start listening
app.server.listen(process.env.PORT || 8080, () => {
    console.log(`Started on port ${app.server.address().port}`);
});

export default app;