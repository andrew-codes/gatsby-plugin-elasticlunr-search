const {crossEnv} = require('nps');

module.exports = {
    scripts: {
        build: `babel src --out-dir .`,
        'build/watch': `babel src --watch --out-dir .`,
        default: `nps build/watch`,
        publish: crossEnv(`NODE_ENV=production nps build && npm publish`),
        test: 'echo "Error: no test specified" && exit 1'
    }
};
