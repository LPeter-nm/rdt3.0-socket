# Implementação do Rdt 3.0 com Javascript

Este projeto foi feito com o intuito de aplicar o protocolo de forma que tivéssemos a oportunidade de compreender e aprender ao mesmo tempo que o criávamos. Portanto, o repositório é de cunho educacional e de aprendizagem.

## O que é RDT?
Reliable Data Protocol 3.0 (RDT) é um protocolo com uma abordagem para garantir a transmissão confiável de dados na camada de transporte de redes de comunicação.


## Funcionalidades


- Objetivo: O RDT 3.0 é projetado para fornecer uma comunicação confiável entre dois pontos em uma rede, garantindo que todos os dados enviados sejam recebidos corretamente e na ordem correta. 

- Garantia de Entrega: Ele utiliza técnicas de confirmação (ACKs) e retransmissão de pacotes para garantir que os dados não sejam perdidos ou corrompidos durante a transmissão.

- Mecanismos de Controle:

- Confirmação (ACKs): O receptor envia uma confirmação para o remetente, indicando que um pacote foi recebido corretamente.

- Temporizadores: O remetente utiliza temporizadores para esperar pelas confirmações. Se uma confirmação não é recebida dentro de um período específico, o pacote é retransmitido.

- Número de Sequência: Pacotes são numerados para que o receptor possa identificar e reorganizar pacotes que chegam fora de ordem e detectar pacotes duplicados.

## Instalação

Clone ou baixe o repositório na sua máquina.

```bash
  git clone link_do_repositório
```

Instale as bibliotecas do projeto com npm

```bash
  npm install 
```


## Stack utilizada

*Front-end:* Html, Css

*Back-end:* Node(Dgram), Express


## Referência

Redes de computadores e a Internet uma Abordagem Top-Down




## Autores

- [@Pedro Gabriel](https://github.com/LPeter-nm/)
- [@Jhoão Pedro](https://github.com/Jhopn/)

