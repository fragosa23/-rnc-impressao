# RNC Impressão

Aplicação web para registo e análise de RNC na área de Impressão, com separação entre **Flexografia** e **Rotogravura**.

## Objetivo

Permitir introduzir mensalmente dados por máquina, armazenar esses dados no browser e gerar automaticamente:

- relatório mensal;
- acumulados anuais;
- comparação entre Flexografia e Rotogravura;
- comparação operacional entre secções;
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

4. **Comparação entre secções**  
   Comparação direta entre Flexografia e Rotogravura com OF, RNC, percentagens, taxa de RNC, OF por RNC e índice carga/defeitos.

## Indicadores de comparação entre secções

A comparação entre secções inclui:

- número total de trabalhos/OF por secção;
- percentagem de trabalhos por secção;
- número total de RNC por secção;
- percentagem de RNC por secção;
- taxa de RNC por 100 OF;
- OF por RNC;
- índice carga/defeitos.

### Interpretação

- **Taxa RNC/100 OF:** quanto menor, melhor.
- **OF por RNC:** quanto maior, melhor.
- **Índice carga/defeitos:** compara o peso dos trabalhos com o peso das RNC. Se uma secção faz muitos trabalhos mas tem proporcionalmente menos RNC, apresenta melhor relação operacional.

### Limitação importante

Esta comparação ainda não mede rentabilidade real em euros. Para calcular rentabilidade seriam necessários mais dados:

- margem média por trabalho;
- metros ou kg produzidos;
- horas de produção;
- custo de mão de obra;
- desperdício;
- paragens;
- retrabalho;
- custo médio de cada RNC.

Com os dados atuais, a aplicação mede **desempenho operacional e qualidade relativa**, não rentabilidade financeira completa.

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
