<div>
  <p><a href="https://github.com/Squad-Back-End/reprography-nodejs/blob/master/docs/README.md">Voltar</a></p>
  <p><a href="https://github.com/Squad-Back-End/reprography-nodejs/edit/master/docs/rest_api_client/README-en.md">English Version</a></p>
</div>

## POSTMAN

[English Version](https://github.com/Squad-Back-End/reprography-nodejs/blob/master/docs/rest_api_client/postman/README-en.md)

### O que é Postman:

O Postman é uma ferramenta que dá suporte à documentação das requisições feitas pela API. Ele possui ambiente para a documentação, execução de testes de APIs e requisições em geral.

Ao utilizá-lo, você passará a trabalhar com APIs de modo mais eficiente, construindo solicitações rapidamente e, ainda, poderá guardá-las para uso posterior, além de conseguir analisar as respostas enviadas pela API.

Um bom motivo para usar essa ferramenta é que, por meio dela, é possível reduzir drasticamente o tempo necessário para testar e desenvolver APIs.

Em um exemplo prático, imagine que você queira fazer uma solicitação GET para procurar certas informações no nome da empresa.

Se fosse o caso de testar uma solicitação GET sem usar o Postman, você precisaria escrever todo um código para executar a requisição, além de uma interface visual para interagir com essa rotina.

Se fosse concedido, provavelmente você precisaria escrever tudo isso para criar um aplicativo funcional usando essa API, mas todo esse trabalho seria simplesmente para testar a sua funcionalidade, o que de fato, nesse formato, é tedioso e demorado.

### Por que usar o Postman?

Além de ser um aplicativo gratuito e fácil de aprender, com pouco tempo você já estará enviando seus primeiros requests (solicitações/requisições). No mais, trata-se de uma ferramenta com um amplo suporte para todas as APIs e Schemas.

**Download Postman App:** https://www.postman.com/downloads/?utm_source=postman-home

![image](https://user-images.githubusercontent.com/71888050/142628036-780b4135-ce4b-4602-98fa-02969972ef8b.png)

### Criando uma Collection:

Collection(coleções) é o local onde fica guardado todos os códigos desenvolvidos.

Para criar uma collection, basta clicar em Collection:

![image](https://user-images.githubusercontent.com/71888050/142628476-bef75124-d3d1-401d-9e9f-e4f50a182030.png)

Coloque um nome e clique em Create:

![image](https://user-images.githubusercontent.com/71888050/142628517-ff8b1253-b4e6-4e25-ac66-0964424f1b13.png)

Criando uma Requisição

Para criar uma requisição, clique em New em seguida em request:

![image](https://user-images.githubusercontent.com/71888050/142628575-a4070117-45e2-4e74-b5b8-ec969ae9495c.png)

Nomeie sua requisição, em seguida selecione a collection (Select a collection or folder to save to), e Salve na collection selecionada.

![image](https://user-images.githubusercontent.com/71888050/142628632-c4b5dd99-259b-4d43-bd36-7253558d10f8.png)

Em seguida selecione o método HTTP desejado(GET, PUT, POST...)

![image](https://user-images.githubusercontent.com/71888050/142628688-46398c3e-1642-48ff-9f92-36d389ceeed4.png)

## Importando uma Collection:
Colocamos essa URL de exemplo para importação, que será usada futuramente
```bash 
https://www.getpostman.com/collections/0c9b504d153a377db01a
```
Você pode importar pela tela inicial

![import6](https://user-images.githubusercontent.com/71890228/142638750-ae4c91fd-1fc0-45f2-9456-d5956a4569d4.png)

Agora, basta clicar em "Import" no canto superior esquerdo da tela

![import2](https://user-images.githubusercontent.com/71890228/142635964-49db79fc-86d1-4797-8b3a-d84ccd63217c.png)

Clique em "Import from Link" e cole a URL de exemplo, depois clique em "continue"

![import3](https://user-images.githubusercontent.com/71890228/142636416-14d76417-567d-4a82-bccf-050ef548acf0.png)

Clique "Import", aparecerá no canto esquerdo as coleções disponíveis

![import4](https://user-images.githubusercontent.com/71890228/142636674-13bca015-23be-4408-becf-6edff01fa90f.png)

Ao final aparecerá uma coleção chamada "DEFAULT", onde estará disponível todas as opções de requisição

![import5](https://user-images.githubusercontent.com/71890228/142637406-732b61cc-46a6-4ff0-ad80-07263c856664.png)

Assim terminamos a importação de Collection via Postman.

* Importação de collection criado com o auxilio deste [tutorial.](https://nfe.io/docs/documentacao/nota-fiscal-produto-eletronica/importar-colecao-postman/)
