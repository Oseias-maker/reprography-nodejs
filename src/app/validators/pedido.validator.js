const isParameterValid = (params) => {
    if (params == 1) {
        return [1, 2];
    }
    else if (params == 0) {
        return [0, 0];
    }
};

const validatorPedido = {
    isParameterValid: isParameterValid
};

module.exports = validatorPedido;