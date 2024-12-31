require('dotenv').config({ debug: true, override: false })
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser')
const http = require("http");
const https = require('https');
const cors = require('cors');
var fileUpload = require('express-fileupload');
const app = express();

const port = process.env.PORT || 80;
//const port_https = process.env.PORT_HTTPS || 443;
const routes = require('./routes');
const rfs = require("rotating-file-stream");
const path = require("path");
const fileWriter = rfs.createStream('errors.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
});
const {StatusCodes} = require('http-status-codes');
const fs = require("fs");

require('events').EventEmitter.defaultMaxListeners = 15;

const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT,PATCH, DELETE, OPTIONS, ');
    res.header('Access-Control-Allow-Credentials', false);
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
};
app.use(cors());
app.use(allowCrossDomain);
// Error logger
app.use(logger('dev', {
    skip: function (req, res) { return res.statusCode < 400 },
    stream: fileWriter
}))
app.use(logger('dev'));
// app.use(fileUpload());
// app.use(bodyParser.urlencoded({extended: false}));
// app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/v1", routes);
app.use('/favicon.ico', (req, res) => {
    res.status(StatusCodes.OK).send();
});

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = StatusCodes.NOT_FOUND;
    next(error);
});

// error handler middleware
app.use((error, req, res) => {
    if (process.env.NODE_ENV === "dev") {
        res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).send({message: error.message || 'Internal Server Error',});
    } else {
        res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).send({message: 'Internal Server Error',});
    }
});

http.createServer(app).listen(port, () => {
    console.log('HTTP API server started on http://localhost:'+ port+'/api/v1');
});

// Create an HTTPS service identical to the HTTP service. Uncomment below line
// const options = {
//    key: fs.readFileSync('/domain.com.key'),
//    cert: fs.readFileSync('/certificate.crt')
// };
// https.createServer(options, app).listen(port_https, () => {
//     console.log('HTTPS API server started on https://localhost:'+ port_https+'/api/v1');
// });

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason)
});

app.use('/uploads', express.static('uploads'));
