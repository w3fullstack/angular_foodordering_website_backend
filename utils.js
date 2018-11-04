var utils = {};

utils.getCreatedAt = function() {
    return Math.floor(Date.now()/1000);
}

module.exports = utils;