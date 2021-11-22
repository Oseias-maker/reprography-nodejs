//Arquivo de config
const config = require("../../config/").authConfig;

//Services

//Service do usuário
const service = require("../services/usuario.service");
//Enviando descrição de constraints para o front-end/email
const verifyConstraints = require("../services/verifyConstraints");

//Validators
const { adminArray } = require("../validators/usuario.validator");

//Constants
const constants = require("../constants/usuario.constant");
const status = require("../constants/status.constant");

//Usado para criptografar as senhas no banco -> Nesse caso para comparar a senha 
//quando o usuário solicitar mudança de senha.
const bcrypt = require("bcrypt");

//Usado para enviar o token e informações do usuário pro front quando ele Logar
const { sign } = require("jsonwebtoken");

//Funções do usuário 
module.exports = {

    //Usuários 

    logar: async (req, res) => {

        const { emailOrNif, senha } = req.body;

        if (!emailOrNif || !senha) {
            return res.status(400).json({ status: status.error, message: "Requisição faltando campos de email ou senha!" });
        }

        try {
            let user = await service.findOneByEmail(emailOrNif);

            //Login com usuário ou NIF
            if (user == null) {
                user = await service.findUserbyPk(emailOrNif, { attributes: null });
                if (!user) {
                    return res.json({ status: status.error, message: constants.invalidLogin });
                }
                else if (user.ativado === 0 && user.primeiro_acesso === 0) {
                    return res.json({ status: status.error, message: constants.accountDisabled });
                }
            }
            else {

                if (user.ativado === 0 && user.primeiro_acesso === 1) {
                    return res.json({ status: status.error, message: "Primeiro acesso requer NIF ao invés do e-mail." });
                };

                if (user.ativado === 0) {
                    return res.json({ status: status.error, message: constants.accountDisabled });
                };
            };

            await bcrypt.compare(senha, user.senha).then((match) => {
                if (!match) {
                    return res.json({
                        status: status.error,
                        message: constants.invalidLogin
                    });
                };

                let authorities = [];
                service.getRoles(user).then(roles => {
                    for (let i = 0; i < roles.length; i++) {
                        authorities.push(roles[i].id + "_ROLE_" + roles[i].descricao.toUpperCase());
                    };

                    const token = sign({ nif: user.nif, nome: user.nome, email: user.email, imagem: user.imagem, roles: authorities, }, config.jwt.secret, {
                        expiresIn: 86400 // 24 hours
                    });

                    return res.status(200).json({
                        nif: user.nif,
                        nome: user.nome,
                        email: user.email,
                        imagem: user.imagem,
                        roles: authorities,
                        accessToken: token,
                        primeiro_acesso: user.primeiro_acesso
                    });
                });
            })
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    informacoesBasicas: async (req, res) => {
        try {
            let user = await service.findUserbyPk(req.user.nif, {
                attributes: { exclude: ["senha"] }
            });

            const depto = await verifyConstraints({ departamento: user.dataValues.depto });

            user.dataValues.depto = depto[0].descricao;

            return res.status(200).json(user);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    primeiroAcesso: async (req, res) => {
        const { senha, confirmSenha } = req.body;

        if (senha !== confirmSenha) {
            return res.json({ status: status.error, message: constants.valuesNotMatch });
        }

        try {
            const user = await service.findUserbyPk(req.user.nif, { attributes: { exclude: ["senha"] } });

            if (user.primeiro_acesso == 0) {
                return res.json({ status: status.error, message: "Esse não é seu primeiro acesso!" });
            }

            await bcrypt.hash(confirmSenha, config.jwt.saltRounds, async function (err, hash) {
                if (err) throw (err);
                await service.updateUser({ user, param: { senha: hash, primeiro_acesso: 0, ativado: 1 } });

                return res.status(200).json({ status: status.ok, message: constants.attPassword })
            })
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    //Altera 
    alterarMeuUsuario: async (req, res) => {
        const user = await service.findUserbyPk(req.user.nif, { attributes: { exclude: ["senha"] } });

        const { nome, telefone, email } = req.body;

        console.log(user.imagem);

        let imagem = user.imagem;

        if (req.file) {
            imagem = req.file.path;
        }

        try {
            await service.updateUser({ user, param: { nome, telefone, email, imagem }, file: req.file });

            return res.status(200).json({ status: status.ok, message: `Sua conta foi atualizada com sucesso!!` });
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    alterarSenha: async (req, res) => {
        const { senhaAntiga, senhaNova, confirmSenhaNova } = req.body;

        if (senhaNova !== confirmSenhaNova) {
            return res.json({ status: status.error, message: constants.valuesNotMatch });
        }

        try {
            const user = await service.findUserbyPk(req.user.nif, { attributes: null });

            bcrypt.compare(senhaAntiga, user.senha).then((match) => {
                if (!match) return res.json({ status: status.error, message: "A senha inserida no campo Senha antiga está incorreta." });

                bcrypt.hash(senhaNova, config.jwt.saltRounds, async function (err, hash) {
                    if (err) throw (err);
                    await service.updateUser({ user, senha: hash });
                    return res.status(200).json({ status: status.ok, message: constants.attPassword });
                });
            });

        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    //Usuário pode excluir a própria conta (exclui pelo nif do usuário logado)
    desativarMeuUsuario: async (req, res) => {
        try {
            const user = await service.findUserbyPk(req.user.nif, { attributes: { exclude: ["senha"] } });

            if (user == null) {
                return res.json({ status: status.error, message: "Não há nenhum usuário (ativado) com esse NIF" });
            };

            await service.updateUser({ user, param: { ativado: 0 } });

            return res.status(200).json({ status: status.ok, message: `Sua conta foi desativada com sucesso!` });
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },


    //Gerentes --- (ADMIN)

    //Registrar usuário
    adicionarUsuario: async (req, res) => {
        const { nif, nome, telefone, depto, email, cfp } = req.body;
        let { admin } = req.body;

        // Imagem padrão caso não seja inserida nenhuma imagem.
        let image = config.adminAccount.defaultImage;

        //Senha padrão
        const senha = config.defaultPassword;

        if (req.file) {
            image = req.file.path;
        }

        //Regra de negócio para Controle de Usuário -> Se Input de Roles for 1 (usuário for ADM)
        //Ele faz a busca de admin na tabela roles, e registra o id de Admin no usuário a ser criado 
        //na tabela user_roles
        try {
            const adminValidated = await adminArray(admin);

            bcrypt.hash(senha, config.jwt.saltRounds, async (err, hash) => {
                if (err) throw (err);
                const user = await service.addUser({ param: { nif: nif, senha: hash, nome: nome, telefone: telefone, depto, email: email, cfp: cfp, imagem: image } })
                if (adminValidated) {
                    let roles = await service.getDescRoles(adminValidated);
                    await service.setRoles(user, roles);
                }
                else {
                    service.setRoles([1]);
                }
                return res.status(200).json({ status: status.ok, message: `Usuário com nif ${user.nif} criado com sucesso!` });
            })
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    buscarTodos: async (req, res) => {
        const { enabled } = req.params;

        try {
            let users = await service.findAllUsers(enabled);

            if (users.length < 1) {
                return res.json({ status: status.error, message: "Sem registros..." });
            }

            for (let i = 0; i < users.length; i++) {
                const depto = await verifyConstraints({ departamento: users[i].dataValues.depto });

                users[i].dataValues.depto = depto[0].descricao;
            }

            return res.status(200).json(users);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    buscarPorNome: async (req, res) => {
        try {
            let users = await service.findAllByName(req.params.user);

            if (users.length < 1) {
                return res.json({ status: status.error, message: `Usuários com nome ${req.params.user} não encontrados` });
            };

            for (let i = 0; i < users.length; i++) {
                const depto = await verifyConstraints({ departamento: users[i].dataValues.depto });

                users[i].dataValues.depto = depto[0].descricao;
            };

            return res.status(200).json(users);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    buscarPorNif: async (req, res) => {
        try {
            let user = await service.findUserbyPk(req.params.nif, { attributes: { exclude: ["senha"] } });

            if (user == null) {
                return res.status(404).json({ status: status.error, message: constants.notFound });
            };

            const depto = await verifyConstraints({ departamento: user.dataValues.depto });

            user.dataValues.depto = depto[0].descricao;

            return res.status(200).json(user);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    alterarPorNif: async (req, res) => {
        const { nome, senha, telefone, depto, email, cfp } = req.body;
        let { admin } = req.body;

        try {
            const user = await service.findUserbyPk(req.params.nif, { attributes: { exclude: ["senha"] } });

            if (user == null) {
                return res.json({ status: status.error, message: constants.notFound });
            };

            if (admin) {
                const adminValidated = await adminArray(admin);
                const roles = await service.getDescRoles(adminValidated);
                await service.setRoles(user, roles);
            };

            let imagem = user.imagem;

            if (req.file) {
                imagem = req.file.path;
            };

            bcrypt.hash(senha, config.jwt.saltRounds, async function (err, hash) {
                if (err) throw (err);
                await service.updateUser({ user: user, param: { nome, senha: hash, telefone, depto, email, cfp, imagem }, file: req.file });

                return res.status(200).json({ status: status.ok, message: `Conta com NIF ${req.params.nif} atualizada com sucesso!!` });
            });
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    enableOrDisableAccount: async (req, res) => {
        const { nif, enable } = req.params;

        try {
            const user = await service.findUserbyPk(nif, { attributes: { exclude: ["senha"] } });

            if (user == null) {
                return res.status(404).json({ status: status.error, message: constants.notFound });
            };

            await service.updateUser({ user: user, param: { ativado: enable } });

            return res.status(200).json({ status: status.ok, message: `Status do Usuário ${user.nif} atualizado com sucesso!` });
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    // excluirPorNif: async (req, res) => {
    //     const user = await service.findUserbyPk(req.params.nif, { attributes: null });    

    //     if (user == null) {
    //         return res.status(404).json({ status: 'error', message: "Usuário não encontrado!" });
    //     }
    //     await service.destroyUser(user);

    //     if (user.imagem !== config.adminAccount.defaultImage) {
    //         await unlink(user.imagem, (err) => {
    //             if (err) throw err;
    //             console.log(`successfully deleted ${user.imagem}`);
    //         });
    //     }


    //     return res.status(200).json({ status: 'ok', message: `Conta com NIF ${user.nif} excluida com sucesso!!` });
    // }
};