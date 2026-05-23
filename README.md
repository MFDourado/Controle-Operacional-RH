# BlinTrack — Calculadora de Bonificação

Sistema web para lançamento e cálculo de bonificações da equipe operacional, com exportação de relatório Word/PDF via Google Apps Script.

---

## 📁 Estrutura

```
calculadora-bonificacao/
├── index.html        ← Interface web (este arquivo)
├── appscript.gs      ← Código do Google Apps Script
└── README.md         ← Este arquivo
```

---

## 🚀 Como usar

### 1. Subir no GitHub Pages
1. Crie um repositório no GitHub (pode ser dentro da org do BlinTrack)
2. Suba os arquivos (`index.html`, `appscript.gs`, `README.md`)
3. Ative **GitHub Pages** em Settings → Pages → Branch: `main`
4. Acesse via `https://seuusuario.github.io/calculadora-bonificacao`

---

### 2. Configurar o Google Apps Script

1. Acesse [script.google.com](https://script.google.com) → **Novo projeto**
2. Nomeie como `BlinTrack — Bonificação`
3. Cole todo o conteúdo de `appscript.gs`
4. Clique em **Implantar → Nova implantação**
5. Tipo: **App da Web**
6. Executar como: **Eu (sua conta)**
7. Quem tem acesso: **Qualquer pessoa** *(necessário para o fetch do HTML)*
8. Clique em **Implantar** e copie a **URL gerada**

---

### 3. Conectar o HTML ao AppScript

Na calculadora aberta no navegador:
1. Clique no botão **⚙️ AppScript** (canto superior direito da barra de importação)
2. Cole a URL copiada no passo anterior
3. Clique em **Salvar URL**

A URL fica salva no `localStorage` do navegador. Não precisa configurar de novo.

---

## 📊 Formato do arquivo .xlsx para importação

A calculadora aceita um `.xlsx` com **abas separadas por seção** ou **aba única** com colunas específicas.

### Opção A — Abas separadas (recomendado)

| Aba | Colunas obrigatórias |
|-----|----------------------|
| `Tecnico` ou `OS` | `Técnico`, `OS Técnico`, `OS Ajudante` |
| `Viagem` | `Técnico`, `Destino`, `Tipo`, `Dias` |
| `Montagem` | `Técnico`, `Tipo`, `Qtd` |
| `Sobreaviso` | `Técnico`, `Datas`, `Horas` |

### Opção B — Aba única
Use as colunas acima em uma única aba. O sistema detecta automaticamente o tipo de cada linha pelo conjunto de colunas presentes.

### Valores aceitos em `Tipo` (Viagens)
- `Instalação`
- `Manutenção`

### Valores aceitos em `Tipo` (Montagens)
- `Rack HD` → R$ 150
- `Bandeja` → R$ 25
- `Upgrade` → R$ 50
- `Rack IP` → R$ 150
- `Bônus Rack HD` → R$ 300

---

## 💡 Regras de cálculo

| Item | Valor |
|------|-------|
| OS Técnico | R$ 6,00/OS |
| OS Ajudante | R$ 4,00/OS |
| Viagem | R$ 50,00/dia |
| Rack HD | R$ 150,00/un |
| Bandeja | R$ 25,00/un |
| Upgrade | R$ 50,00/un |
| Rack IP | R$ 150,00/un |
| Bônus Rack HD | R$ 300,00/un |

---

## 📄 O que o relatório gera

O AppScript cria automaticamente na pasta **BlinTrack — Relatórios** no Google Drive:
- Um **Google Doc** editável com todas as seções
- Um **PDF** para download direto

A URL do Google Doc é aberta automaticamente no navegador após a geração.

---

## 🔧 Personalização

Para adicionar novos tipos de montagem, edite o array `TIPOS_MONTAGEM` no `index.html`:
```js
const TIPOS_MONTAGEM = [
  { label: "Rack HD – R$150",       valor: 150 },
  { label: "Meu novo tipo – R$XX",  valor: XX  },
  // ...
];
```

---

*BlinTrack — Blincast Tecnologia*
