module.exports = {
    scripts: {
        build: `babel src --out-dir .`,
        'build/watch': `babel src --watch --out-dir .`,
        default: `nps build/watch`,
        test: 'echo "Error: no test specified" && exit 1'
    }
};
