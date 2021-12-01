//Arquivo de config
const config = require("../../config/").authConfig;

const { unlink } = require("fs");

const unlinkImg = async (params) => {
    if (params !== config.adminAccount.defaultImage) {
        try {
            await unlink(params, (err) => {
                if (err) throw err;
                console.log(`successfully deleted ${params}`);
            });
            return;
        } catch (error) {
            console.log(error);
            return;
        }
    } 
    else {
        return;
    }
}

module.exports = unlinkImg;