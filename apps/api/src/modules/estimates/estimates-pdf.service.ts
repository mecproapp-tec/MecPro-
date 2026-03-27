<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento #{{estimateNumber}}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: #fff;
      color: #333;
      font-size: 14px;
      line-height: 1.4;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      border: 1px solid #e0e0e0;
      padding: 20px;
      border-radius: 8px;
    }
    /* Cabeçalho */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0077ff;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo {
      max-height: 80px;
      max-width: 200px;
    }
    .company-info {
      text-align: right;
      font-size: 12px;
      color: #666;
    }
    .company-info h2 {
      margin: 0 0 5px;
      color: #0077ff;
      font-size: 18px;
    }
    /* Título do documento */
    .title {
      text-align: center;
      margin: 20px 0;
    }
    .title h1 {
      font-size: 28px;
      color: #0077ff;
      margin: 0;
    }
    /* Dados do cliente */
    .client-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #0077ff;
    }
    .client-box h3 {
      margin: 0 0 10px;
      color: #0077ff;
      font-size: 16px;
    }
    .client-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .client-details p {
      margin: 0;
    }
    .client-details strong {
      color: #0077ff;
    }
    /* Tabela de itens */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f0f7ff;
      color: #0077ff;
      font-weight: 600;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      background-color: #f0f7ff;
      font-weight: bold;
    }
    .total-row td {
      border-top: 2px solid #0077ff;
    }
    /* Rodapé */
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
    .status {
      display: inline-block;
      background: #e6f4ff;
      color: #0077ff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .validity {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cabeçalho -->
    <div class="header">
      <div>
        {{#if logoUrl}}
          <img src="{{logoUrl}}" alt="Logo" class="logo">
        {{else}}
          <div style="width: 150px; height: 60px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
            <span style="color: #999;">Logo</span>
          </div>
        {{/if}}
      </div>
      <div class="company-info">
        <h2>{{companyName}}</h2>
        <p>{{companyDocument}}</p>
        <p>{{companyPhone}} | {{companyEmail}}</p>
      </div>
    </div>

    <!-- Título -->
    <div class="title">
      <h1>ORÇAMENTO Nº {{estimateNumber}}</h1>
      <span class="status">{{status}}</span>
    </div>

    <!-- Cliente -->
    <div class="client-box">
      <h3>Dados do Cliente</h3>
      <div class="client-details">
        <p><strong>Nome:</strong> {{client.name}}</p>
        <p><strong>Telefone:</strong> {{client.phone}}</p>
        <p><strong>Veículo:</strong> {{client.vehicle}}</p>
        <p><strong>Placa:</strong> {{client.plate}}</p>
        <p><strong>Documento:</strong> {{client.document}}</p>
        <p><strong>Endereço:</strong> {{client.address}}</p>
      </div>
    </div>

    <!-- Itens -->
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Qtd</th>
          <th>Valor Unitário (R$)</th>
          <th>ISS (%)</th>
          <th>Total (R$)</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{this.description}}</td>
          <td class="text-right">{{this.quantity}}</td>
          <td class="text-right">{{this.unitPrice}}</td>
          <td class="text-right">{{this.issPercent}}</td>
          <td class="text-right">{{this.total}}</td>
        </tr>
        {{/each}}
        <tr class="total-row">
          <td colspan="4" class="text-right"><strong>Subtotal</strong></td>
          <td class="text-right"><strong>R$ {{subtotal}}</strong></td>
        </tr>
        {{#if issValue}}
        <tr>
          <td colspan="4" class="text-right"><strong>ISS ({{issRate}}%)</strong></td>
          <td class="text-right"><strong>R$ {{issValue}}</strong></td>
        </tr>
        {{/if}}
        <tr class="total-row">
          <td colspan="4" class="text-right"><strong>TOTAL GERAL</strong></td>
          <td class="text-right"><strong>R$ {{total}}</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Validade e observações -->
    <div class="validity">
      <p><strong>Emissão:</strong> {{issueDate}} &nbsp;|&nbsp; <strong>Validade:</strong> {{validUntil}}</p>
      <p><strong>Observações:</strong> Este orçamento tem validade de 10 dias a partir da data de emissão. Após aprovado, será convertido em fatura.</p>
    </div>

    <!-- Rodapé -->
    <div class="footer">
      <p>{{companyName}} - {{companyDocument}}<br>
      {{companyPhone}} | {{companyEmail}}<br>
      Este documento foi gerado eletronicamente e dispensa assinatura.</p>
    </div>
  </div>
</body>
</html>