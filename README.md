# RNC Impressão

Aplicação web para registo e análise de RNC na área de Impressão, com separação entre **Flexografia** e **Rotogravura**.

## Objetivo

Permitir introduzir mensalmente dados por máquina, armazenar esses dados no browser e gerar automaticamente:

- relatório mensal;
- acumulados anuais;
- comparação entre Flexografia e Rotogravura;
- ranking de máquinas por taxa de RNC por 100 OF;
- alertas automáticos para máquinas acima da média ou em estado crítico.

## Estrutura do projeto

```text
-rnc-impressao/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── reports.js
│   ├── charts.js
│   └── ai-import.js
├── assets/
│   └── README.md
└── README.md
```

## Menus principais

1. **Introduzir e armazenar dados**  
   Preenchimento de OF/trabalhos e RNC por máquina.

2. **Relatório mensal**  
   Consulta mês a mês, com navegação lateral/swipe.

3. **Acumulados do ano**  
   Consulta dos totais anuais, com navegação por ano.

## Máquinas iniciais

### Flexografia

- IF1
- IF2
- IF3
- IF4

### Rotogravura

- IR1
- IR3
- IR4
- IR5

## Fórmula principal

```text
Taxa RNC por 100 OF = (RNC / OF) × 100
```

## Regras de cor

- **Verde:** apenas quando a taxa é exatamente 0%.
- **Amarelo:** taxa maior que 0 e menor ou igual à média global.
- **Laranja:** taxa acima da média global e até 5%.
- **Vermelho:** taxa superior a 5%.

Regra crítica: **não conformidade nunca é “bom” se for superior a zero**.

## Integração futura com IA

Está prevista uma funcionalidade futura para leitura automática de dados através de fotografias.

O utilizador poderá tirar ou carregar uma fotografia de um relatório, quadro, folha impressa ou gráfico mensal. A IA deverá:

1. ler os dados da imagem;
2. identificar máquinas, secções, OF/trabalhos e RNC;
3. validar se os valores fazem sentido;
4. pedir confirmação ao utilizador antes de gravar;
5. introduzir automaticamente os dados no mês selecionado.

Ficheiro reservado:

```text
js/ai-import.js
```

Formato esperado da IA:

```json
[
  { "machine": "IF1", "section": "Flexografia", "of": 150, "rnc": 5 },
  { "machine": "IR1", "section": "Rotogravura", "of": 10, "rnc": 2 }
]
```

## Estado

Versão inicial em HTML, CSS e JavaScript puro.  
Prioridade: cálculos transparentes, previsíveis e auditáveis.
