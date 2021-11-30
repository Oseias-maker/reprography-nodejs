//Arquivo de config
const config = require("../../config/").authConfig;

const { unlink } = require("fs");

const unlinkImg = async (params) => {
    if (params !== config.adminAccount.defaultImage) {
        await unlink(params, (err) => {
            if (err) throw err;
            console.log(`successfully deleted ${params}`);
        });
        return;
    } 
    else {
        return;
    }
}

module.exports = unlinkImg;