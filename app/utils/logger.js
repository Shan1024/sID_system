var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: false,
            json: true,
            maxsize: 5242880, //5MB
            colorize: false
        }),
        new winston.transports.Console({
            handleExceptions: false,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function (message, encoding) {
        //logger.info(message);
        logger.info(message.slice(0, -1));
    }
};
